import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  MessageSquare,
  ShieldCheck,
  Stethoscope,
  Timer,
  Video,
  ScanLine,
  ArrowRight,
  Sparkles,
  Zap,
  Lock,
  CheckCircle2,
} from "lucide-react";
import heroImage from "@/assets/hero-rehab.jpg";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/layout";
import { useLanguage } from "@/context/LanguageContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RehabAI — AI-Powered Physiotherapy & Posture Tracking" },
      {
        name: "description",
        content:
          "Real-time webcam posture analysis, accurate rep counting, progress tracking, and expert physiotherapist consultations.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { language } = useLanguage();

  const isHi = language === "hi";

  const features = [
    {
      icon: ScanLine,
      title: isHi ? "लाइव फॉर्म जांच" : "LIVE FORM CHECK",
      body: isHi
        ? "AI वेबकैम से 33 जोड़ों को ट्रैक करता है और हर फ्रेम में घुटने, कूल्हे और पीठ के कोणों की जांच करता है।"
        : "AI reads 33 joints straight from your webcam and grades knee, hip and back angles every frame.",
    },
    {
      icon: Timer,
      title: isHi ? "सटीक रेप गिनती" : "VALID REP COUNTING",
      body: isHi
        ? "रेप्स तभी गिने जाते हैं जब गहराई और मुद्रा सही सीमा में हों — ताकि आप केवल सही वर्कआउट करें।"
        : "Reps only count when depth and posture hit target range — so you can't cheat your way to a good score.",
    },
    {
      icon: BarChart3,
      title: isHi ? "प्रगति ट्रैकिंग" : "PROGRESS TRACKING",
      body: isHi
        ? "सटीकता रुझान, सत्र इतिहास और स्ट्रिक ट्रैकर जो दिखाते हैं कि आप वास्तव में सुधार कर रहे हैं।"
        : "See trends, streaks and your improvement over time with detailed session analytics.",
    },
    {
      icon: Stethoscope,
      title: isHi ? "डॉक्टर से जुड़ें" : "CONNECT WITH A DOCTOR",
      body: isHi
        ? "अपना सत्र इतिहास और स्थिति सत्यापित फिजियोथेरेपिस्ट के साथ साझा करें और विशेषज्ञ सलाह पाएं।"
        : "Share sessions and get expert guidance from a licensed physiotherapist.",
    },
    {
      icon: MessageSquare,
      title: isHi ? "सुरक्षित चैट" : "SECURE CHAT",
      body: isHi
        ? "अपने डॉक्टर के साथ ऐप के भीतर सुरक्षित और निजी संदेश सेवा।"
        : "Chat with your clinician inside the app with end-to-end encrypted messaging.",
    },
    {
      icon: Video,
      title: isHi ? "वीडियो परामर्श" : "ON-DEMAND VIDEO CALL",
      body: isHi
        ? "लाइव मूवमेंट जांच के लिए जब भी जरूरत हो अपने डॉक्टर के साथ प्राइवेट वीडियो कॉल करें।"
        : "Book a private video consultation whenever you need a live look at your movement.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 font-sans selection:bg-[#a3e635] selection:text-black">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#070a0f]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-[#a3e635] text-black shadow-lg shadow-[#a3e635]/20">
              <Activity className="size-5" strokeWidth={2.8} />
            </span>
            <span className="text-xl font-bold tracking-tight text-white font-display">
              Rehab<span className="text-[#a3e635]">AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <a href="#exercises" className="hover:text-[#a3e635] transition-colors">
              {isHi ? "व्यायाम" : "Exercises"}
            </a>
            <a href="#features" className="hover:text-[#a3e635] transition-colors">
              {isHi ? "यह कैसे काम करता है" : "How it works"}
            </a>
            <a href="#features" className="hover:text-[#a3e635] transition-colors">
              {isHi ? "डॉक्टरों के लिए" : "For Clinicians"}
            </a>
            <a href="#features" className="hover:text-[#a3e635] transition-colors">
              {isHi ? "हमारे बारे में" : "About"}
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Button asChild variant="ghost" size="sm" className="text-xs text-slate-300 hover:text-white hover:bg-slate-800">
              <Link to="/auth">{isHi ? "साइन इन" : "Sign in"}</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-[#a3e635] text-black font-semibold hover:bg-[#b5f847] shadow-lg shadow-[#a3e635]/20 text-xs px-4"
            >
              <Link to="/auth">{isHi ? "शुरू करें" : "Get started"}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Dark High-Tech Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 border-b border-slate-800/50">
          {/* Neon Glow background elements */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#a3e635]/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              {/* Hero Left Content */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#a3e635]/30 bg-[#a3e635]/10 px-3.5 py-1 text-xs font-bold tracking-wider text-[#a3e635] uppercase">
                  <Zap className="size-3.5" />
                  {isHi ? "AI द्वारा संचालित फिजियोथेरेपी" : "AI POWERED PHYSIOTHERAPY"}
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl font-display leading-[1.08]">
                  {isHi ? (
                    <>
                      आपका फिजियो नहीं देख रहा है।{" "}
                      <span className="block text-[#a3e635] mt-1">अब AI निगरानी कर रहा है।</span>
                    </>
                  ) : (
                    <>
                      YOUR PHYSIO ISN'T WATCHING.{" "}
                      <span className="block text-[#a3e635] mt-1">NOW SOMETHING IS.</span>
                    </>
                  )}
                </h1>

                <p className="text-base text-slate-400 sm:text-lg leading-relaxed max-w-xl">
                  {isHi
                    ? "AI आधारित फॉर्म जांच। सटीक रेप गिनती। विशेषज्ञ फिजियोथेरेपिस्ट — सब एक ही स्थान पर।"
                    : "AI form check. Accurate rep counting. Expert physiotherapists — all in one place."}
                </p>

                {/* Hero CTAs */}
                <div className="flex flex-wrap gap-4 pt-2">
                  <Button
                    asChild
                    size="lg"
                    className="bg-[#a3e635] text-black font-bold hover:bg-[#b5f847] shadow-xl shadow-[#a3e635]/25 text-sm px-6 h-12 rounded-full gap-2"
                  >
                    <Link to="/auth">
                      {isHi ? "निःशुल्क सत्र शुरू करें" : "START A FREE SESSION"}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-slate-700 bg-slate-900/80 text-white hover:bg-slate-800 text-sm px-6 h-12 rounded-full font-semibold"
                  >
                    <Link to="/auth">{isHi ? "मैं एक डॉक्टर हूँ" : "I'M A CLINICIAN"}</Link>
                  </Button>
                </div>

                {/* Hero Metrics Badge Row */}
                <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-lg bg-slate-800/90 text-[#a3e635]">
                      <ScanLine className="size-4" />
                    </span>
                    <div>
                      <p className="font-bold text-white text-base">33</p>
                      <p className="text-slate-400 text-[11px]">{isHi ? "ट्रैक किए गए जोड़" : "Tracked Joints"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-lg bg-slate-800/90 text-[#a3e635]">
                      <Lock className="size-4" />
                    </span>
                    <div>
                      <p className="font-bold text-white text-base">0</p>
                      <p className="text-slate-400 text-[11px]">{isHi ? "अपलोड किए गए फ्रेम" : "Frames Uploaded"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-lg bg-slate-800/90 text-[#a3e635]">
                      <Zap className="size-4" />
                    </span>
                    <div>
                      <p className="font-bold text-white text-base">&lt;1s</p>
                      <p className="text-slate-400 text-[11px]">{isHi ? "प्रतिक्रिया समय" : "Feedback Latency"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero Right Visual Card */}
              <div className="lg:col-span-6 relative">
                <div className="relative rounded-2xl border border-slate-800 bg-slate-900/90 p-3 shadow-2xl overflow-hidden group">
                  <img
                    src={heroImage}
                    alt="AI Posture Analysis"
                    width={1200}
                    height={800}
                    className="w-full rounded-xl object-cover aspect-[4/3] filter brightness-90 group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* AI Floating Card Overlay */}
                  <div className="absolute bottom-6 right-6 left-6 rounded-xl border border-[#a3e635]/40 bg-[#070a0f]/90 p-4 backdrop-blur-md shadow-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="relative flex size-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#a3e635] opacity-75" />
                        <span className="relative inline-flex rounded-full size-3 bg-[#a3e635]" />
                      </span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#a3e635]">
                          {isHi ? "उत्तम गहराई (GOOD DEPTH)" : "GOOD DEPTH"}
                        </p>
                        <p className="text-xs text-slate-300 mt-0.5">
                          {isHi ? "छाती को सीधा रखें" : "Hold that chest up"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right border-l border-slate-800 pl-4">
                      <p className="text-xs font-semibold text-white">Rep 7</p>
                      <p className="text-[11px] text-[#a3e635]">92% {isHi ? "सटीकता" : "accuracy"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 border-b border-slate-800/50 relative">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl uppercase font-display">
                {isHi
                  ? "आपकी पहली रेप से लेकर असली डॉक्टर तक सब कुछ"
                  : "EVERYTHING BETWEEN YOUR FIRST REP AND A REAL CLINICIAN"}
              </h2>
              <p className="text-sm text-slate-400">
                {isHi
                  ? "RehabAI आपके वेबकैम को एक बुद्धिमान फिजियोथेरेपी सहायक में बदल देता है।"
                  : "RehabAI turns your webcam into an intelligent physiotherapy assistant."}
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <article
                  key={f.title}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition-all hover:border-[#a3e635]/40 hover:bg-slate-900 group space-y-4"
                >
                  <span className="grid size-12 place-items-center rounded-xl bg-slate-800 text-[#a3e635] group-hover:bg-[#a3e635] group-hover:text-black transition-colors">
                    <f.icon className="size-6" />
                  </span>
                  <h3 className="text-base font-bold text-white tracking-wide">{f.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom Banner */}
        <section className="py-16 bg-[#070a0f]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="rounded-2xl border border-[#a3e635]/30 bg-gradient-to-r from-slate-900 via-slate-900 to-[#a3e635]/10 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <h2 className="text-2xl font-extrabold text-white sm:text-3xl tracking-tight uppercase font-display">
                  {isHi ? "केवल वही रेप्स करें जो वास्तव में गिने जाएं।" : "DO THE REPS THAT ACTUALLY COUNT."}
                </h2>
                <p className="text-xs text-slate-400">
                  {isHi
                    ? "निःशुल्क शुरू करें। कोई उपकरण नहीं, कोई ऐप इंस्टॉल नहीं, और आपका वीडियो ब्राउज़र से बाहर नहीं जाता।"
                    : "Free to start. No equipment, no app install, and your camera feed never leaves the browser."}
                </p>
              </div>

              <Button
                asChild
                size="lg"
                className="bg-[#a3e635] text-black font-bold hover:bg-[#b5f847] shadow-xl text-sm px-8 h-12 rounded-full shrink-0"
              >
                <Link to="/auth">
                  {isHi ? "अपना खाता बनाएं →" : "CREATE YOUR ACCOUNT →"}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#05070a] py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 space-y-2">
          <p>© {new Date().getFullYear()} RehabAI. All posture processing stays 100% private on your device.</p>
        </div>
      </footer>
    </div>
  );
}
