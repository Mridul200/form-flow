CREATE TYPE public.app_role AS ENUM ('patient','doctor','admin');
CREATE TYPE public.request_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.payment_status AS ENUM ('pending','paid','failed');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Anonymous',
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.doctor_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  specialty TEXT NOT NULL DEFAULT 'Physical Therapy',
  bio TEXT NOT NULL DEFAULT '',
  years_experience INT NOT NULL DEFAULT 5,
  fee_amount INT NOT NULL DEFAULT 499,
  status public.request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_profiles TO authenticated;
GRANT SELECT ON public.doctor_profiles TO anon;
GRANT ALL ON public.doctor_profiles TO service_role;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  exercise TEXT NOT NULL DEFAULT 'squat',
  accuracy INT NOT NULL DEFAULT 0,
  valid_reps INT NOT NULL DEFAULT 0,
  invalid_reps INT NOT NULL DEFAULT 0,
  duration_seconds INT NOT NULL DEFAULT 0,
  corrections TEXT[] NOT NULL DEFAULT '{}',
  summary TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT ALL ON public.sessions TO service_role;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.connect_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  condition TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status public.request_status NOT NULL DEFAULT 'pending',
  revoked BOOLEAN NOT NULL DEFAULT false,
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL DEFAULT 'mock',
  transaction_id TEXT,
  amount INT NOT NULL DEFAULT 499,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connect_requests TO authenticated;
GRANT ALL ON public.connect_requests TO service_role;
ALTER TABLE public.connect_requests ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_active_link(_doctor UUID, _patient UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connect_requests
    WHERE doctor_id = _doctor AND patient_id = _patient
      AND status = 'approved' AND revoked = false AND payment_status = 'paid'
  )
$$;

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.connect_requests ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  text TEXT NOT NULL,
  flagged BOOLEAN NOT NULL DEFAULT false,
  removed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_request_participant(_request UUID, _user UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connect_requests
    WHERE id = _request AND (patient_id = _user OR doctor_id = _user)
      AND status = 'approved' AND revoked = false AND payment_status = 'paid'
  )
$$;

-- profiles policies
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- user_roles policies
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- doctor_profiles policies
CREATE POLICY "doctor_profiles_select_public" ON public.doctor_profiles FOR SELECT TO anon USING (status = 'approved');
CREATE POLICY "doctor_profiles_select_auth" ON public.doctor_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "doctor_profiles_update_own" ON public.doctor_profiles FOR UPDATE TO authenticated USING (id = auth.uid() AND public.has_role(auth.uid(),'doctor')) WITH CHECK (id = auth.uid());
CREATE POLICY "doctor_profiles_admin_all" ON public.doctor_profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- sessions policies
CREATE POLICY "sessions_own_all" ON public.sessions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "sessions_doctor_select" ON public.sessions FOR SELECT TO authenticated USING (public.has_active_link(auth.uid(), user_id));
CREATE POLICY "sessions_admin_select" ON public.sessions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- connect_requests policies
CREATE POLICY "cr_patient_select" ON public.connect_requests FOR SELECT TO authenticated USING (patient_id = auth.uid());
CREATE POLICY "cr_patient_insert" ON public.connect_requests FOR INSERT TO authenticated WITH CHECK (patient_id = auth.uid());
CREATE POLICY "cr_patient_update" ON public.connect_requests FOR UPDATE TO authenticated USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid());
CREATE POLICY "cr_doctor_select" ON public.connect_requests FOR SELECT TO authenticated USING (doctor_id = auth.uid());
CREATE POLICY "cr_doctor_update" ON public.connect_requests FOR UPDATE TO authenticated USING (doctor_id = auth.uid() AND payment_status = 'paid') WITH CHECK (doctor_id = auth.uid());
CREATE POLICY "cr_admin_all" ON public.connect_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- messages policies
CREATE POLICY "messages_participant_select" ON public.messages FOR SELECT TO authenticated USING (public.is_request_participant(request_id, auth.uid()));
CREATE POLICY "messages_participant_insert" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND public.is_request_participant(request_id, auth.uid()));
CREATE POLICY "messages_participant_flag" ON public.messages FOR UPDATE TO authenticated USING (public.is_request_participant(request_id, auth.uid())) WITH CHECK (public.is_request_participant(request_id, auth.uid()));
CREATE POLICY "messages_admin_all" ON public.messages FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- signup handler
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  requested TEXT := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
  final_role public.app_role;
BEGIN
  IF requested = 'doctor' THEN final_role := 'doctor'; ELSE final_role := 'patient'; END IF;

  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, final_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF final_role = 'doctor' THEN
    INSERT INTO public.doctor_profiles (id, specialty, bio)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'specialty','Physical Therapy'), COALESCE(NEW.raw_user_meta_data->>'bio',''))
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;