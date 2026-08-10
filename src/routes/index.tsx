import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  MessageSquare,
  ShieldCheck,
  Stethoscope,
  Timer,
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
      { title: "Rehavila — AI-Powered Physiotherapy & Posture Tracking" },
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
  const { language, t } = useLanguage();

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
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-[#a3e635] text-black shadow-lg shadow-[#a3e635]/20">
              <Activity className="size-5" strokeWidth={2.8} />
            </span>
            <span className="text-xl font-bold tracking-tight text-white font-display">
              Rehavila
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
              {isHi ? "डॉक्टरों के लिए" : "For Doctors"}
            </a>
            <a href="#about" className="hover:text-[#a3e635] transition-colors">
              {isHi ? "हमारे बारे में" : "About"}
            </a>
          </nav>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <LanguageToggle />
            <Button asChild variant="ghost" size="sm" className="h-10 text-xs text-slate-300 hover:text-white hover:bg-slate-800">
              <Link to="/auth">{isHi ? "साइन इन" : "Sign in"}</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="h-10 bg-[#a3e635] text-black font-semibold hover:bg-[#b5f847] shadow-lg shadow-[#a3e635]/20 text-xs px-4"
            >
              <Link to="/auth">{isHi ? "शुरू करें" : "Get started"}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Dark High-Tech Hero Section */}
        <section className="relative overflow-hidden pt-10 pb-16 sm:pt-14 sm:pb-20 lg:pt-20 lg:pb-32 border-b border-slate-800/50">
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

                <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-6xl font-display leading-[1.08]">
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
                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
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
                </div>

                {/* Hero Metrics Badge Row */}
                <div className="pt-6 border-t border-slate-800/80 grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
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
                  <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-[#a3e635]/40 bg-[#070a0f]/90 p-3 backdrop-blur-md shadow-2xl flex flex-col gap-3 sm:bottom-6 sm:left-6 sm:right-6 sm:flex-row sm:items-center sm:justify-between sm:p-4">
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
                    <div className="text-left border-t border-slate-800 pt-3 sm:text-right sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                      <p className="text-xs font-semibold text-white">Rep 7</p>
                      <p className="text-[11px] text-[#a3e635]">92% {isHi ? "सटीकता" : "accuracy"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Exercises Section */}
        <section id="exercises" className="py-20 border-b border-slate-800/50 relative">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl uppercase font-display">
                {t.exercisesSectionTitle}
              </h2>
              <p className="text-sm text-slate-400">
                {t.exercisesSectionDesc}
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { key: "all", label: t.all, icon: Activity },
                { key: "ankle", label: t.ankle, icon: Activity },
                { key: "knee", label: t.knee, icon: Activity },
                { key: "hip", label: t.hip, icon: Activity },
                { key: "balance", label: t.balance, icon: Activity },
              ].map((cat) => (
                <Link
                  key={cat.key}
                  to="/auth"
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition-all hover:border-[#a3e635]/40 hover:bg-slate-900 group space-y-4 text-center"
                >
                  <span className="grid size-12 place-items-center rounded-xl bg-slate-800 text-[#a3e635] group-hover:bg-[#a3e635] group-hover:text-black transition-colors mx-auto">
                    <cat.icon className="size-6" />
                  </span>
                  <h3 className="text-base font-bold text-white tracking-wide">{cat.label}</h3>
                  <p className="text-xs text-[#a3e635] font-semibold group-hover:underline">
                    {isHi ? "शुरू करें" : "Start"} →
                  </p>
                </Link>
              ))}
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
                   ? "Rehavila आपके वेबकैम को एक बुद्धिमान फिजियोथेरेपी सहायक में बदल देता है।"
                   : "Rehavila turns your webcam into an intelligent physiotherapy assistant."}
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

        {/* About Section */}
        <section id="about" className="py-20 border-b border-slate-800/50 relative">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl uppercase font-display">
                  {isHi ? "हमारे बारे में" : "ABOUT REHAVILA"}
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {isHi
                    ? "Rehavila आधुनिक AI तकनीक और पुनर्वास विज्ञान को एक साथ लाता है ताकि हर किसी को सटीक, सुलभ और निजी मूवमेंट कोचिंग मिल सके। हमारा मिशन है कि गुणवत्तापूर्ण फिजियोथेरेपी सहायता सीमाओं से परे हो और हर घर तक पहुंच सके।"
                    : "Rehavila combines modern AI with rehabilitation science to deliver accurate, accessible, and private movement coaching. Our mission is to make quality physiotherapy support available beyond clinic walls and reach every home."}
                </p>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {isHi
                    ? "हमारा प्लेटफॉर्म वेबकैम-आधारित मूवमेंट विश्लेषण, रीयल-टाइम फीडबैक और बाद में आने वाले प्रगति ट्रैकिंग प्रदान करता है — सब कुछ ब्राउज़र में चलता है, बिना किसी अपलोड के।"
                    : "Our platform delivers webcam-based movement analysis, real-time feedback, and progress tracking — all running in the browser with zero uploads, so your data never leaves your device."}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-xs font-semibold text-[#a3e635] uppercase tracking-wider mb-1">
                      {isHi ? "गोपनीयता पहले" : "Privacy First"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {isHi
                        ? "सभी विश्लेषण स्थानीय रूप से होता है। कोई फ्रेम अपलोड नहीं होता।"
                        : "All analysis happens locally. No frames ever leave your device."}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-xs font-semibold text-[#a3e635] uppercase tracking-wider mb-1">
                      {isHi ? "सटीकता" : "Accuracy"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {isHi
                        ? "33 जोड़ों को ट्रैक करने और वास्तविक समय में कोचिंग लक्ष्यों को पूरा करने के लिए डिज़ाइन किया गया।"
                        : "Designed to track 33 joints and meet real-time coaching benchmarks."}
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-[#a3e635]/10 text-[#a3e635]">
                      <ShieldCheck className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">On-device processing</p>
                      <p className="text-xs text-slate-400">
                        {isHi ? "आपका वीडियो कभी सर्वर पर नहीं जाता" : "Your video never goes to a server"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-[#a3e635]/10 text-[#a3e635]">
                      <Sparkles className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">AI-powered feedback</p>
                      <p className="text-xs text-slate-400">
                        {isHi ? "हर फ्रेम पर सटीक मूवमेंट गाइडेंस" : "Precise movement guidance on every frame"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-[#a3e635]/10 text-[#a3e635]">
                      <BarChart3 className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">Progress tracking</p>
                      <p className="text-xs text-slate-400">
                        {isHi ? "सटीकता रुझान और सत्र इतिहास देखें" : "See accuracy trends and session history"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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
          <p>© {new Date().getFullYear()} Rehavila. {t.footerPrivacy}</p>
        </div>
      </footer>
    </div>
  );
}
