import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Activity, Loader2, Stethoscope, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BrandMark, MedicalDisclaimer } from "@/components/layout";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or create your RehabAI account" },
      {
        name: "description",
        content:
          "Log in as a patient or physiotherapist to run AI form checks, track progress and connect securely.",
      },
      { property: "og:title", content: "Sign in to RehabAI" },
      {
        property: "og:description",
        content: "Patient and clinician access to AI-guided rehab sessions.",
      },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name: name || email.split("@")[0], role },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          return;
        }
        toast.success("Account created");
        navigate({ to: role === "doctor" ? "/doctor" : "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      setBusy(false);
      toast.error("Google sign-in failed. Try email instead.");
    }
    // Supabase will redirect the browser to Google — no further action needed.
  }

  return (
    <main className="hero-gradient flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="mb-8">
        <BrandMark />
      </Link>

      <div className="surface-card w-full max-w-md p-6 sm:p-8">
        {sent ? (
          <div className="space-y-3 text-center">
            <h1 className="text-xl font-semibold">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              We sent a confirmation link to <span className="font-medium">{email}</span>. Click it
              to activate your account, then sign in.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
              Back to sign in
            </Button>
          </div>
        ) : (
          <>
            <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signup" className="mt-6">
                <div className="mb-5">
                  <Label className="mb-2 block">I am a</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <RoleCard
                      active={role === "patient"}
                      onClick={() => setRole("patient")}
                      icon={<User className="size-4" />}
                      title="Patient"
                      hint="Do guided sessions"
                    />
                    <RoleCard
                      active={role === "doctor"}
                      onClick={() => setRole("doctor")}
                      icon={<Stethoscope className="size-4" />}
                      title="Doctor"
                      hint="Needs admin approval"
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="signin" className="mt-6" />
            </Tabs>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Priya Sharma"
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
                {mode === "signup" ? "Create account" : "Sign in"}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
              Continue with Google
            </Button>

            {mode === "signup" && role === "doctor" && (
              <p className="mt-4 rounded-xl bg-accent p-3 text-xs text-accent-foreground">
                <Activity className="mr-1 inline size-3" />
                Clinician accounts stay inactive until an administrator verifies them. Licence
                verification is mocked for this demo (future scope).
              </p>
            )}
          </>
        )}
      </div>

      <MedicalDisclaimer className="mt-8 max-w-md text-center" />
    </main>
  );
}

function RoleCard({
  active,
  onClick,
  icon,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition-colors ${
        active
          ? "border-primary bg-accent text-accent-foreground"
          : "border-border bg-card hover:bg-muted"
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </span>
      <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
    </button>
  );
}
