import React, { createContext, useContext, useState } from "react";

export type Language = "en" | "hi";

export interface Translations {
  appName: string;
  tagline: string;
  signIn: string;
  signOut: string;
  dashboard: string;
  exercises: string;
  progress: string;
  connect: string;
  welcomeBack: string;
  consistencyHeader: string;
  lastFormScore: string;
  currentStreak: string;
  totalSessions: string;
  validReps: string;
  noSessionsYet: string;
  keepItAlive: string;
  startToday: string;
  allTime: string;
  startExercise: string;
  exploreLibrary: string;
  all: string;
  ankle: string;
  knee: string;
  hip: string;
  balance: string;
  viewInstructions: string;
  correctForm: string;
  commonMistakes: string;
  targetJoint: string;
  cameraPose: string;
  targetReps: string;
  startCameraTest: string;
  positionYourself: string;
  positionDesc: string;
  cameraFeedActive: string;
  landmarksVisible: string;
  cameraDistance: string;
  active: string;
  waiting: string;
  visible: string;
  moveIntoFrame: string;
  good: string;
  adjusting: string;
  adjustToUnlock: string;
  startSession: string;
  endSession: string;
  savingSession: string;
  formScore: string;
  disclaimer: string;
  backToLibrary: string;
  demoHeader: string;
  howToPerform: string;
  readyToStart: string;
  readyDesc: string;
  repetitions: string;
  needsWork: string;
  liveJointAngles: string;
  audioAssistant: string;
  voiceOn: string;
  voiceOff: string;
  beepOn: string;
  beepOff: string;
  volume: string;
  goodFormLabel: string;
  adjustFormLabel: string;
  incorrectFormLabel: string;
  stepBackMsg: string;
  searchPlaceholder: string;
  aiGuidedSubtitle: string;
  libraryDesc: string;
  noMatchSearch: string;
  tryAdjustFilters: string;
  holdSeconds: string;
}

const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    appName: "RehabAI",
    tagline: "AI-Guided Physiotherapy & Posture Tracking",
    signIn: "Sign in",
    signOut: "Sign out",
    dashboard: "Dashboard",
    exercises: "Exercise Library",
    progress: "Progress & History",
    connect: "Connect Doctor",
    welcomeBack: "Welcome back",
    consistencyHeader: "Consistency beats intensity. Even one clean set today moves the trend line.",
    lastFormScore: "Last Form Score",
    currentStreak: "Current Streak",
    totalSessions: "Total Sessions",
    validReps: "valid reps",
    noSessionsYet: "No sessions yet",
    keepItAlive: "Keep it alive",
    startToday: "Start today",
    allTime: "All time",
    startExercise: "Start an Exercise",
    exploreLibrary: "Explore Full 10-Exercise Library →",
    all: "All",
    ankle: "Ankle",
    knee: "Knee",
    hip: "Hip",
    balance: "Balance",
    viewInstructions: "View Instructions & Start",
    correctForm: "Correct Form & Posture",
    commonMistakes: "Common Mistakes to Avoid",
    targetJoint: "Target Joint",
    cameraPose: "Camera Pose",
    targetReps: "Target Reps",
    startCameraTest: "Start Camera Test",
    positionYourself: "Position Yourself",
    positionDesc: "Make sure you are in a well-lit area with space to perform the movement safely.",
    cameraFeedActive: "Camera Feed Active",
    landmarksVisible: "Required Joint Landmarks Visible",
    cameraDistance: "Camera Distance & Lighting",
    active: "Active",
    waiting: "Waiting",
    visible: "Visible",
    moveIntoFrame: "Move into Frame",
    good: "Good",
    adjusting: "Adjusting…",
    adjustToUnlock: "Adjust Position to Unlock",
    startSession: "Start Exercise Session",
    endSession: "End Session",
    savingSession: "Saving Session…",
    formScore: "Exercise Form Score",
    disclaimer:
      "RehabAI provides movement feedback for general fitness and rehab support. It is not a substitute for professional medical advice, diagnosis or treatment.",
    backToLibrary: "Back to Exercise Library",
    demoHeader: "A. Exercise Demonstration & Movement Steps",
    howToPerform: "B. How to Perform Step-by-Step",
    readyToStart: "Ready to Start Your Session?",
    readyDesc: "Click below to launch the live camera positioning check. Your video stays strictly on your device.",
    repetitions: "Repetitions",
    needsWork: "Needs Work",
    liveJointAngles: "Live Joint Angles",
    audioAssistant: "Audio & Voice Assistant",
    voiceOn: "Voice ON",
    voiceOff: "Voice OFF",
    beepOn: "Beep ON",
    beepOff: "Beep OFF",
    volume: "Volume",
    goodFormLabel: "🟢 GOOD FORM",
    adjustFormLabel: "⚠️ ADJUST FORM",
    incorrectFormLabel: "🔴 INCORRECT FORM",
    stepBackMsg: "Please stay in full view of the camera.",
    searchPlaceholder: "Search exercise, joint, or description…",
    aiGuidedSubtitle: "AI Pose-Guided Physiotherapy",
    libraryDesc: "Select an exercise below to view detailed step-by-step instructions, posture rules, common mistakes, and run a live camera test.",
    noMatchSearch: "No exercises match your search",
    tryAdjustFilters: "Try adjusting your filters or search keywords.",
    holdSeconds: "s hold",
  },
  hi: {
    appName: "RehabAI",
    tagline: "AI-संचालित फिजियोथेरेपी और मुद्रा ट्रैकिंग",
    signIn: "साइन इन करें",
    signOut: "साइन आउट",
    dashboard: "डैशबोर्ड",
    exercises: "व्यायाम पुस्तकालय",
    progress: "प्रगति और इतिहास",
    connect: "डॉक्टर से जुड़ें",
    welcomeBack: "वापसी पर स्वागत है",
    consistencyHeader: "निरंतरता ही सफलता की कुंजी है। आज का एक साफ सेट भी आपकी प्रगति को बढ़ाता है।",
    lastFormScore: "अंतिम फॉर्म स्कोर",
    currentStreak: "वर्तमान स्ट्रिक",
    totalSessions: "कुल सत्र",
    validReps: "सही रेप्स",
    noSessionsYet: "अभी तक कोई सत्र नहीं",
    keepItAlive: "इसे जारी रखें",
    startToday: "आज ही शुरू करें",
    allTime: "कुल मिलाकर",
    startExercise: "व्यायाम शुरू करें",
    exploreLibrary: "पूरा 10-व्यायाम पुस्तकालय देखें →",
    all: "सभी",
    ankle: "टखना (Ankle)",
    knee: "घुटना (Knee)",
    hip: "कूल्हा (Hip)",
    balance: "संतुलन (Balance)",
    viewInstructions: "निर्देश देखें और शुरू करें",
    correctForm: "सही मुद्रा और तरीके (Correct Form)",
    commonMistakes: "बचने योग्य सामान्य गलतियाँ (Common Mistakes)",
    targetJoint: "मुख्य जोड़",
    cameraPose: "कैमरा स्थिति",
    targetReps: "लक्ष्य रेप्स",
    startCameraTest: "कैमरा टेस्ट शुरू करें",
    positionYourself: "खुद को सही स्थिति में रखें",
    positionDesc: "सुनिश्चित करें कि आप पर्याप्त रोशनी वाले स्थान पर हैं जहाँ सुरक्षित रूप से व्यायाम कर सकें।",
    cameraFeedActive: "कैमरा फीड सक्रिय",
    landmarksVisible: "आवश्यक जोड़ स्पष्ट दिखाई दे रहे हैं",
    cameraDistance: "कैमरा दूरी और रोशनी",
    active: "सक्रिय",
    waiting: "प्रतीक्षा में",
    visible: "दिखाई दे रहा है",
    moveIntoFrame: "फ्रेम के अंदर आएं",
    good: "उत्तम",
    adjusting: "समायोजन हो रहा है…",
    adjustToUnlock: "अनलॉक करने के लिए स्थिति बदलें",
    startSession: "व्यायाम सत्र शुरू करें",
    endSession: "सत्र समाप्त करें",
    savingSession: "सत्र सहेजा जा रहा है…",
    formScore: "व्यायाम फॉर्म स्कोर",
    disclaimer:
      "RehabAI फिटनेस और पुनर्वास सहायता के लिए मूवमेंट फीडबैक प्रदान करता है। यह पेशेवर चिकित्सा सलाह का विकल्प नहीं है।",
    backToLibrary: "व्यायाम पुस्तकालय पर वापस जाएं",
    demoHeader: "अ. व्यायाम प्रदर्शन और चरण",
    howToPerform: "ब. चरण-दर-चरण व्यायाम कैसे करें",
    readyToStart: "क्या आप अपना सत्र शुरू करने के लिए तैयार हैं?",
    readyDesc: "लाइव कैमरा स्थिति की जांच शुरू करने के लिए नीचे क्लिक करें। आपका वीडियो केवल आपके डिवाइस पर ही रहता है।",
    repetitions: "पुनरावृत्तियां (Repetitions)",
    needsWork: "सुधार की आवश्यकता",
    liveJointAngles: "लाइव जोड़ कोण (Angles)",
    audioAssistant: "ऑडियो और आवाज़ सहायक",
    voiceOn: "आवाज़ चालू",
    voiceOff: "आवाज़ बंद",
    beepOn: "बीप चालू",
    beepOff: "बीप बंद",
    volume: "आवाज़ का स्तर",
    goodFormLabel: "🟢 सही फॉर्म",
    adjustFormLabel: "⚠️ फॉर्म में सुधार करें",
    incorrectFormLabel: "🔴 गलत फॉर्म",
    stepBackMsg: "कृपया कैमरे के सामने पूरी तरह दिखाई दें।",
    searchPlaceholder: "व्यायाम, जोड़ या विवरण खोजें…",
    aiGuidedSubtitle: "AI पोज़-निर्देशित फिजियोथेरेपी",
    libraryDesc: "विस्तृत चरण-दर-चरण निर्देश, मुद्रा नियम, सामान्य गलतियाँ देखने और लाइव कैमरा टेस्ट चलाने के लिए नीचे दिए गए व्यायाम को चुनें।",
    noMatchSearch: "आपकी खोज से मेल खाता कोई व्यायाम नहीं मिला",
    tryAdjustFilters: "कृपया फ़िल्टर या खोज शब्द बदलकर प्रयास करें।",
    holdSeconds: "सेकंड रोकें",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("rehab_lang") as Language;
      if (saved === "en" || saved === "hi") return saved;
    }
    return "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("rehab_lang", lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: TRANSLATIONS[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return { language: "en" as Language, setLanguage: () => {}, t: TRANSLATIONS["en"] };
  }
  return ctx;
}
