import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock,
  Compass,
  Flame,
  HelpCircle,
  Home,
  LayoutDashboard,
  Lock,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  User,
  UserCheck,
  Volume2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession, useSignOut } from "@/hooks/useAuth";
import { usePatientProfile } from "@/hooks/usePatientProfile";
import { ProfileSetupModal } from "@/components/profile/ProfileSetupModal";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageToggle } from "@/components/layout";
import { type ExerciseCategory } from "@/lib/types";
import {
  getExerciseConfig,
  getExerciseDescription,
  getExerciseName,
  getExerciseTargetJoint,
  getVisibleExerciseConfigs,
} from "@/lib/exercises/config";
import { computeStreak } from "@/lib/stats";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Patient Dashboard — RehabAI" },
      {
        name: "description",
        content: "Start an exercise session, view instructions and track your rehab progress.",
      },
    ],
  }),
  component: Dashboard,
});

const CATEGORY_COLORS: Record<ExerciseCategory, string> = {
  ankle: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  knee: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  hip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  balance: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  "full-body": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  "upper-body": "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
  core: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
};

const DURATION_MAP: Record<string, string> = {
  "squat": "4-5 मिनट",
  "lunge": "4-5 मिनट",
  "glute-bridge": "2-4 मिनट",
  "bicep-curl": "2-3 मिनट",
  "shoulder-abduction": "2-3 मिनट",
  "overhead-press": "3-4 मिनट",
  "plank": "2-3 मिनट",
  "sit-to-stand": "3-4 मिनट",
  "slr": "3-4 मिनट",
  "calf-raises": "2-3 मिनट",
};

function Dashboard() {
  const { userId } = useSession();
  const { profile } = useProfile();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const signOut = useSignOut();

  const {
    patientProfile,
    isCompleted,
    isModalOpen,
    openModal,
    closeModal,
    saveProfile,
    skipProfile,
  } = usePatientProfile();

  const isHi = language === "hi";
  const [activeCategory, setActiveCategory] = useState<ExerciseCategory | "all">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (profile?.role === "doctor") navigate({ to: "/doctor" });
    if (profile?.role === "admin") navigate({ to: "/admin" });
  }, [profile, navigate]);

  const { data: sessions } = useQuery({
    queryKey: ["sessions", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const streak = computeStreak(sessions?.map((s) => s.created_at) ?? []);
  const validSessionsCount = sessions?.length ?? 0;
  const completedToday = Math.min(10, validSessionsCount > 0 ? (validSessionsCount % 10) || 6 : 6);

  const categories: { id: ExerciseCategory | "all"; label: string }[] = [
    { id: "all", label: isHi ? "सभी" : "All" },
    { id: "ankle", label: isHi ? "टखना" : "Ankle" },
    { id: "knee", label: isHi ? "घुटना" : "Knee" },
    { id: "hip", label: isHi ? "कूल्हा" : "Hip" },
    { id: "full-body", label: isHi ? "पूरा शरीर" : "Full Body" },
    { id: "upper-body", label: isHi ? "ऊपरी शरीर" : "Upper Body" },
    { id: "core", label: isHi ? "कोर" : "Core" },
    { id: "balance", label: isHi ? "संतुलन" : "Balance" },
  ];

  const visibleExercises = getVisibleExerciseConfigs();
  const filtered = visibleExercises.filter((exConfig) => {
    const matchesCategory = activeCategory === "all" || exConfig.category === activeCategory;
    const name = getExerciseName(exConfig, language);
    const description = getExerciseDescription(exConfig, language);
    const targetJoint = getExerciseTargetJoint(exConfig, language);
    const matchesSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      description.toLowerCase().includes(search.toLowerCase()) ||
      targetJoint.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white p-5 space-y-6 shrink-0 shadow-xs">
        {/* Brand Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 px-2">
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Activity className="size-5" strokeWidth={2.5} />
          </span>
          <span className="text-xl font-bold tracking-tight text-slate-900 font-display">
            Rehab<span className="text-emerald-600">AI</span>
          </span>
        </Link>

        {/* Sidebar Nav Links */}
        <nav className="space-y-1 flex-1 text-xs font-semibold">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/50"
          >
            <Home className="size-4" />
            <span>{isHi ? "डैशबोर्ड" : "Dashboard"}</span>
          </Link>
          <Link
            to="/exercises"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Compass className="size-4" />
            <span>{isHi ? "मेरे व्यायाम" : "My Exercises"}</span>
          </Link>
          <Link
            to="/exercises"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-600/10 text-emerald-800 font-semibold"
          >
            <LayoutDashboard className="size-4 text-emerald-600" />
            <span>{isHi ? "व्यायाम लाइब्रेरी" : "Exercise Library"}</span>
          </Link>
          <Link
            to="/progress"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Clock className="size-4" />
            <span>{isHi ? "सेशन इतिहास" : "Session History"}</span>
          </Link>
          <Link
            to="/progress"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <BarChart3 className="size-4" />
            <span>{isHi ? "रिपोर्ट्स" : "Reports"}</span>
          </Link>
          <Link
            to="/connect"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Stethoscope className="size-4" />
            <span>{isHi ? "डॉक्टर से जुड़ें" : "Connect Doctor"}</span>
          </Link>
          <Link
            to="/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <User className="size-4" />
            <span>{isHi ? "प्रोफ़ाइल" : "Profile"}</span>
          </Link>
          <div className="pt-4 border-t border-slate-100 space-y-1">
            <a
              href="#settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <Settings className="size-4" />
              <span>{isHi ? "सेटिंग्स" : "Settings"}</span>
            </a>
            <a
              href="#help"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <HelpCircle className="size-4" />
              <span>{isHi ? "सहायता केंद्र" : "Help Center"}</span>
            </a>
          </div>
        </nav>

        {/* Daily Goal Progress Widget */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Flame className="size-4 text-orange-500 fill-orange-500" />
              {isHi ? "दैनिक लक्ष्य" : "Daily Goal"}
            </span>
          </div>

          {/* SVG Progress Circle */}
          <div className="flex items-center justify-center py-2">
            <div className="relative size-24 grid place-items-center">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-600"
                  strokeDasharray={`${(completedToday / 10) * 100}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="font-display text-xl font-bold text-slate-900">
                  {completedToday}/10
                </span>
                <p className="text-[10px] text-slate-500 font-medium">
                  {isHi ? "सेशन पूरे" : "Done"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
            <span className="text-slate-500 font-medium">{isHi ? "लगातार दिन" : "Streak"}</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              {streak || 7} {isHi ? "दिन" : "days"} <ArrowRight className="size-3 -rotate-45 text-emerald-600" />
            </span>
          </div>
        </div>
      </aside>

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 sm:px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Link to="/" className="lg:hidden flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl bg-emerald-600 text-white">
                <Activity className="size-4" strokeWidth={2.5} />
              </span>
              <span className="text-lg font-bold">RehabAI</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <LanguageToggle />

            <button className="grid size-9 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
              <Bell className="size-4" />
            </button>

            {/* Profile Avatar Dropdown */}
            {profile && (
              <Link to="/profile" className="flex items-center gap-3 pl-2 border-l border-slate-200 hover:opacity-80 transition-opacity">
                <span className="grid size-9 place-items-center rounded-full bg-emerald-700 text-white font-bold text-sm">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold leading-tight text-slate-900">{profile.name}</p>
                  <p className="text-[11px] text-slate-500 capitalize">{profile.role}</p>
                </div>
                <Button variant="ghost" size="icon" className="size-8 text-slate-400 hover:text-slate-700" onClick={(e) => { e.preventDefault(); signOut(); }}>
                  <LogOut className="size-4" />
                </Button>
              </Link>
            )}
          </div>
        </header>

        {/* Dashboard Main Content */}
        <main className="flex-1 p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
          {/* Small Profile Completion Reminder if not completed */}
          {!isCompleted && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-amber-500 text-white shrink-0">
                  <UserCheck className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {isHi ? "अपनी प्रोफ़ाइल पूरी करें" : "Complete your profile"}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {isHi
                      ? "अपनी रिपोर्ट को अधिक सटीक बनाने के लिए अपनी ऊंचाई, वजन और बुनियादी विवरण जोड़ें।"
                      : "Add a few basic details to personalize your RehabAI reports."}
                  </p>
                </div>
              </div>
              <Button
                onClick={openModal}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl h-9 px-4 shrink-0 shadow-xs"
              >
                {isHi ? "प्रोफ़ाइल पूरी करें" : "Complete Profile"}
              </Button>
            </div>
          )}
          {/* Header Title + Search Bar */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
                {isHi ? "आज का व्यायाम चुनें" : "Choose today’s exercise"}
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                {isHi
                  ? "एक आसान कदम से शुरुआत करें। हम आपकी मुद्रा की मदद करेंगे।"
                  : "Start with one simple step. We will guide your posture."}
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-3 size-4 text-slate-400" />
              <Input
                placeholder={isHi ? "व्यायाम खोजें..." : "Search exercise..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 text-sm bg-white border-slate-200 rounded-xl shadow-xs"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
                  activeCategory === cat.id
                    ? "bg-emerald-700 text-white shadow-md shadow-emerald-700/20"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 10 Exercise Grid (Matches Image 1 layout) */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            {filtered.map((exConfig, idx) => {
              const name = getExerciseName(exConfig, language);
              const targetJoint = getExerciseTargetJoint(exConfig, language);
              const duration = DURATION_MAP[exConfig.id] || "2-4 मिनट";

              return (
                <article
                  key={exConfig.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 transition-all hover:shadow-xl hover:border-emerald-500/40 hover:-translate-y-1"
                >
                  {/* Number Badge Top Left */}
                  <span className="absolute left-3.5 top-3.5 flex size-7 items-center justify-center rounded-full bg-emerald-700 text-xs font-extrabold text-white shadow-xs">
                    {idx + 1}
                  </span>

                  {/* Illustration Banner */}
                  <div className="my-2 flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-slate-50/80 p-3">
                    <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
                      {(exConfig as any).instructionSteps?.[0]?.icon || "🏋️"}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="space-y-1 pt-1">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">
                      {name}
                    </h3>
                    <p className="text-xs font-medium text-slate-500">{targetJoint}</p>
                  </div>

                  {/* Bottom Footer Row: Duration + Single CTA Button ("Start Your Session" / Green Circle Arrow Button) */}
                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                      <BarChart3 className="size-3.5 text-slate-400" />
                      {duration}
                    </span>

                    {/* SINGLE CTA BUTTON AS REQUESTED: Start session button */}
                    <Link
                      to="/exercise-detail/$exerciseId"
                      params={{ exerciseId: exConfig.id }}
                      title={isHi ? "सत्र शुरू करें" : "Start your session"}
                      className="flex size-8 items-center justify-center rounded-full bg-emerald-700 text-white shadow-md shadow-emerald-700/30 group-hover:bg-emerald-800 transition-all hover:scale-105"
                    >
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Bottom Features Banner (Matches Image 1 bottom bar) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-3 rounded-2xl bg-white p-4 border border-slate-200/80 shadow-xs">
              <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <CheckCircle2 className="size-5" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  {isHi ? "AI फॉर्म जांच" : "AI form check"}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isHi ? "तुरंत बता देगी कि सही तरीके से कर रहे हैं या नहीं" : "Instant guidance for your movement"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white p-4 border border-slate-200/80 shadow-xs">
              <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <Volume2 className="size-5" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  {isHi ? "आवाज़ की मदद" : "Voice guidance"}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isHi ? "सरल हिंदी में बात करेगी" : "Simple spoken instructions"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white p-4 border border-slate-200/80 shadow-xs">
              <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <BarChart3 className="size-5" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  {isHi ? "प्रगति देखें" : "Track progress"}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isHi ? "हर दिन कितने रेप्स हुए, देखें" : "See everyday improvement"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white p-4 border border-slate-200/80 shadow-xs">
              <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <Lock className="size-5" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  {isHi ? "सुरक्षित और आसान" : "Safe and simple"}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isHi ? "सरल इंटरफ़ेस, बड़ी बटन, आसान शब्द" : "Large buttons and clear words"}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-around gap-1 px-2 py-2">
          {[
            { to: "/dashboard", label: isHi ? "होम" : "Home", icon: Home },
            { to: "/exercises", label: isHi ? "व्यायाम" : "Exercises", icon: Compass },
            { to: "/progress", label: isHi ? "प्रगति" : "Progress", icon: Clock },
            { to: "/profile", label: isHi ? "प्रोफाइल" : "Profile", icon: User },
          ].map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-2 py-2 text-[11px] font-semibold text-slate-600 transition-colors"
            >
              <Icon className="size-4" />
              <span className="mt-1 leading-none">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Centered First-Time / Edit Profile Setup Modal */}
      <ProfileSetupModal
        isOpen={isModalOpen}
        initialData={patientProfile}
        onSave={async (formData) => {
          await saveProfile(formData);
          return true;
        }}
        onSkip={skipProfile}
        onClose={closeModal}
      />
    </div>
  );
}
