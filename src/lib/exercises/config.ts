/**
 * Central exercise configuration — single source of truth for all 10 rehab exercises.
 *
 * Adding a new exercise:  add one ExerciseConfig entry to EXERCISE_CONFIGS.
 * Tuning thresholds:      edit the jointRules / repCondition values here only.
 */

import { LM, angleAt, at, mid, visible, verticalOffset } from "./angleUtils";
import type { Landmark } from "./angleUtils";
import type { FormStatus } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AngleTarget {
  min: number;
  max: number;
  tolerance: number; // ±tolerance applied to min/max for edge cases
}

export interface JointRule {
  id: string;        // unique key — matched against correction messages
  label: string;     // human-readable joint name shown in UI
  label_hi?: string;
  getLandmarkIndices: () => number[];
  getAngle: (lms: Landmark[]) => number;
  target: AngleTarget;
  errorKey: string;  // key into corrections map
  phase: "always" | "target"; // when to enforce this rule
}

export interface CorrectionMessages {
  en: string;
  hi: string;
}

export interface InstructionStep {
  title: string;
  description: string;
  title_hi?: string;
  description_hi?: string;
  icon: string; // emoji representing the step
}

export interface ExerciseFormResult {
  visible: boolean;
  score: number;             // 0–100
  formStatus: FormStatus;
  issues: string[];          // errorKeys that are currently failing
  angles: Record<string, number | string>; // label → degrees or formatted text for UI display
}

export type RepPhase = "idle" | "moving" | "at_target" | "returning";

export interface ExerciseConfig {
  id: string;
  name: string;
  name_hi?: string;
  category: "ankle" | "knee" | "hip" | "balance" | "full-body" | "upper-body" | "core";
  difficulty: "beginner" | "intermediate" | "advanced";
  targetJoint: string;
  targetJoint_hi?: string;
  description: string;
  description_hi?: string;
  cameraPosition: "front" | "side" | "any";
  cameraNote: string;
  cameraNote_hi?: string;
  requiredLandmarks: number[];
  targetReps: number;
  holdDuration?: number; // seconds — if set, exercise is isometric hold-based
  jointRules: JointRule[];
  // Rep counting — angle-based
  getPrimaryAngle: (lms: Landmark[]) => number | null;
  startAngle: number;    // angle at "rest/start" position
  startTolerance: number;
  targetAngle: number;   // angle at "target" position
  targetTolerance: number;
  startIsLower: boolean; // true if primary angle DECREASES to reach target
  evaluateForm: (lms: Landmark[]) => ExerciseFormResult;
  instructionSteps: InstructionStep[];
  commonMistakes: string[];
  commonMistakes_hi?: string[];
  corrections: Record<string, CorrectionMessages>;
  positiveRep: CorrectionMessages;
  goodForm: CorrectionMessages;
}

export function getExerciseName(ex: ExerciseConfig, lang: "en" | "hi"): string {
  return lang === "hi" && ex.name_hi ? ex.name_hi : ex.name;
}

export function getExerciseDescription(ex: ExerciseConfig, lang: "en" | "hi"): string {
  return lang === "hi" && ex.description_hi ? ex.description_hi : ex.description;
}

export function getExerciseTargetJoint(ex: ExerciseConfig, lang: "en" | "hi"): string {
  return lang === "hi" && ex.targetJoint_hi ? ex.targetJoint_hi : ex.targetJoint;
}

export function getExerciseCameraNote(ex: ExerciseConfig, lang: "en" | "hi"): string {
  return lang === "hi" && ex.cameraNote_hi ? ex.cameraNote_hi : ex.cameraNote;
}

export function getInstructionSteps(ex: ExerciseConfig, lang: "en" | "hi") {
  return ex.instructionSteps.map((step) => ({
    title: lang === "hi" && step.title_hi ? step.title_hi : step.title,
    description: lang === "hi" && step.description_hi ? step.description_hi : step.description,
    icon: step.icon,
  }));
}

export function getCommonMistakes(ex: ExerciseConfig, lang: "en" | "hi"): string[] {
  if (lang === "hi" && ex.commonMistakes_hi) return ex.commonMistakes_hi;
  return ex.commonMistakes;
}

export function getJointRuleLabel(rule: JointRule, lang: "en" | "hi"): string {
  return lang === "hi" && rule.label_hi ? rule.label_hi : rule.label;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function scoreFromIssues(issueCount: number, total: number): number {
  return Math.max(0, Math.round(100 - (issueCount / Math.max(total, 1)) * 100));
}

function statusFromScore(score: number): FormStatus {
  if (score >= 80) return "good";
  if (score >= 50) return "warning";
  return "bad";
}

// ─── Exercise Configurations (Exactly 10) ─────────────────────────────────────

// 1. SQUAT
const SQUAT: ExerciseConfig = {
  id: "squat",
  name: "Bodyweight Squat",
  name_hi: "बॉडीवेट स्क्वाट (Squats)",
  category: "full-body",
  difficulty: "beginner",
  targetJoint: "Knee / Hip / Spine",
  targetJoint_hi: "घुटना / हिप / रीढ़",
  description: "AI-powered real-time squat form analysis with 3D joint tracking, valgus detection, and voice coaching.",
  description_hi: "3D जॉइंट ट्रैकिंग और वॉयस कोचिंग के साथ स्क्वाट फॉर्म एनालिसिस।",
  cameraPosition: "front",
  cameraNote: "Stand facing the camera so your full body from head to feet is clearly visible.",
  cameraNote_hi: "कैमरा के सामने खड़े रहें ताकि आपका पूरा शरीर दिखाई दे।",
  requiredLandmarks: [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_HIP, LM.RIGHT_HIP, LM.LEFT_KNEE, LM.RIGHT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_ANKLE],
  targetReps: 10,
  jointRules: [
    {
      id: "knee-angle",
      label: "Knee Depth",
      label_hi: "घुटने की गहराई",
      getLandmarkIndices: () => [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE],
      getAngle: (lms) => angleAt(at(lms, LM.LEFT_HIP), at(lms, LM.LEFT_KNEE), at(lms, LM.LEFT_ANKLE)),
      target: { min: 90, max: 120, tolerance: 15 },
      errorKey: "too_shallow",
      phase: "target",
    },
  ],
  getPrimaryAngle: (lms) => {
    if (!visible(lms, [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE])) return null;
    return angleAt(at(lms, LM.LEFT_HIP), at(lms, LM.LEFT_KNEE), at(lms, LM.LEFT_ANKLE));
  },
  startAngle: 165,
  startTolerance: 15,
  targetAngle: 100,
  targetTolerance: 20,
  startIsLower: false,
  evaluateForm: (lms) => {
    const isVisible = visible(lms, [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE]);
    if (!isVisible) return { visible: false, score: 60, formStatus: "warning", issues: [], angles: {} };
    const lKneeAngle = angleAt(at(lms, LM.LEFT_HIP), at(lms, LM.LEFT_KNEE), at(lms, LM.LEFT_ANKLE));
    const rKneeAngle = angleAt(at(lms, LM.RIGHT_HIP), at(lms, LM.RIGHT_KNEE), at(lms, LM.RIGHT_ANKLE));
    const lKneeX = at(lms, LM.LEFT_KNEE).x;
    const lAnkleX = at(lms, LM.LEFT_ANKLE).x;
    const issues: string[] = [];
    if (Math.abs(lKneeX - lAnkleX) > 0.06) issues.push("knee_valgus");
    const score = scoreFromIssues(issues.length, 2);
    return {
      visible: true,
      score,
      formStatus: statusFromScore(score),
      issues,
      angles: { "L Knee": Math.round(lKneeAngle), "R Knee": Math.round(rKneeAngle) },
    };
  },
  instructionSteps: [
    { title: "Starting Position", description: "Stand tall with feet shoulder-width apart, toes pointing slightly outward.", title_hi: "शुरुआती स्थिति", description_hi: "पैरों को कंधे की चौड़ाई पर रखकर सीधे खड़े हों।", icon: "🧍" },
    { title: "Initiate Descent", description: "Hinge at your hips and bend knees as if sitting into a chair. Keep chest up.", title_hi: "नीचे जाना", description_hi: "हिप्स को पीछे धकेलें और घुटनों को मोड़ें, जैसे कुर्सी पर बैठ रहे हों।", icon: "⬇️" },
    { title: "Bottom Position", description: "Lower until thighs are parallel to the floor (approx 90–100° knee angle).", title_hi: "निचली स्थिति", description_hi: "तब तक नीचे जाएं जब तक जांघें फर्श के समानांतर न हो जाएं।", icon: "🦵" },
    { title: "Drive Up", description: "Push through your heels to extend knees and hips back to standing position.", title_hi: "ऊपर उठना", description_hi: "एड़ी पर ज़ोर डालकर वापस सीधे खड़े हो जाएं।", icon: "⬆️" },
  ],
  commonMistakes: ["Knees collapsing inward (valgus)", "Chest leaning too far forward", "Not squatting deep enough", "Heels lifting off the floor"],
  commonMistakes_hi: ["घुटने अंदर की तरफ झुकना", "छाती का बहुत ज्यादा आगे झुकना", "पर्याप्त गहराई तक न जाना", "एड़ी का जमीन से उठना"],
  corrections: {
    knee_valgus: { en: "Push your knees outward — keep them aligned over your toes.", hi: "अपने घुटनों को बाहर की तरफ रखें — उंगलियों की सीध में संरेखित रखें।" },
    torso_lean: { en: "Keep your chest up — avoid leaning forward.", hi: "छाती सीधी रखें — आगे न झुकें।" },
    too_shallow: { en: "Sit deeper — aim for thighs parallel to floor.", hi: "थोड़ा और नीचे बैठें — जांघें फर्श के समानांतर लाएं।" },
  },
  positiveRep: { en: "Great squat repetition!", hi: "बहुत बढ़िया स्क्वाट दोहराव!" },
  goodForm: { en: "Excellent squat form. Keep going!", hi: "शानदार फॉर्म! ऐसे ही करते रहिए।" },
};

// 2. LUNGE
const LUNGE: ExerciseConfig = {
  id: "lunge",
  name: "Forward Lunge",
  name_hi: "लंज (Lunge)",
  category: "full-body",
  difficulty: "intermediate",
  targetJoint: "Knee / Hip",
  targetJoint_hi: "घुटना / हिप",
  description: "Unilateral leg exercise for strengthening quads, glutes, and hamstrings.",
  description_hi: "पैरों की ताकत बढ़ाने के लिए एक बेहतरीन व्यायाम।",
  cameraPosition: "side",
  cameraNote: "Stand sideways to the camera so both legs are visible.",
  cameraNote_hi: "कैमरे के साइड में खड़े हों ताकि दोनों पैर दिखाई दें।",
  requiredLandmarks: [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE],
  targetReps: 10,
  jointRules: [
    {
      id: "knee-angle",
      label: "Front Knee",
      label_hi: "आगे का घुटना",
      getLandmarkIndices: () => [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE],
      getAngle: (lms) => angleAt(at(lms, LM.LEFT_HIP), at(lms, LM.LEFT_KNEE), at(lms, LM.LEFT_ANKLE)),
      target: { min: 80, max: 100, tolerance: 15 },
      errorKey: "knee_bend",
      phase: "target",
    },
  ],
  getPrimaryAngle: (lms) => {
    if (!visible(lms, [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE])) return null;
    return angleAt(at(lms, LM.LEFT_HIP), at(lms, LM.LEFT_KNEE), at(lms, LM.LEFT_ANKLE));
  },
  startAngle: 170,
  startTolerance: 15,
  targetAngle: 90,
  targetTolerance: 20,
  startIsLower: false,
  evaluateForm: (lms) => {
    const isVisible = visible(lms, [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE]);
    if (!isVisible) return { visible: false, score: 60, formStatus: "warning", issues: [], angles: {} };
    const kneeAngle = angleAt(at(lms, LM.LEFT_HIP), at(lms, LM.LEFT_KNEE), at(lms, LM.LEFT_ANKLE));
    const issues: string[] = [];
    if (kneeAngle < 70) issues.push("too_deep");
    const score = scoreFromIssues(issues.length, 2);
    return {
      visible: true,
      score,
      formStatus: statusFromScore(score),
      issues,
      angles: { "Front Knee": Math.round(kneeAngle) },
    };
  },
  instructionSteps: [
    { title: "Start", description: "Stand straight with feet together.", title_hi: "शुरुआत", description_hi: "पैर मिलाकर सीधे खड़े हों।", icon: "🧍" },
    { title: "Step Forward", description: "Take a large step forward with one leg.", title_hi: "आगे कदम रखें", description_hi: "एक पैर से बड़ा कदम आगे बढ़ाएं।", icon: "👣" },
    { title: "Lower Body", description: "Drop your hips until both knees are bent at a 90-degree angle.", title_hi: "शरीर नीचे करें", description_hi: "हिप्स को नीचे लाएं जब तक दोनों घुटने 90 डिग्री पर मुड़ न जाएं।", icon: "⬇️" },
    { title: "Return", description: "Push off your front foot to return to the starting position.", title_hi: "वापस आएं", description_hi: "सामने वाले पैर से जोर लगाकर वापस आएं।", icon: "⬆️" },
  ],
  commonMistakes: ["Knee extending past toes", "Upper body leaning forward", "Back knee touching the floor"],
  commonMistakes_hi: ["घुटना पैर की उंगलियों से आगे जाना", "ऊपरी शरीर का आगे झुकना", "पीछे का घुटना ज़मीन को छूना"],
  corrections: {
    too_deep: { en: "Don't drop too low, keep knee at 90 degrees.", hi: "ज्यादा नीचे न जाएं, घुटना 90 डिग्री पर रखें।" },
    knee_bend: { en: "Bend your knees properly.", hi: "घुटनों को ठीक से मोड़ें।" }
  },
  positiveRep: { en: "Good lunge!", hi: "बहुत बढ़िया लंज!" },
  goodForm: { en: "Perfect form!", hi: "बिलकुल सही फॉर्म!" },
};

// 3. GLUTE BRIDGE
const GLUTE_BRIDGE: ExerciseConfig = {
  id: "glute-bridge",
  name: "Glute Bridge",
  name_hi: "ग्लूट ब्रिज (Glute Bridge)",
  category: "hip",
  difficulty: "beginner",
  targetJoint: "Hip",
  targetJoint_hi: "हिप (Hip)",
  description: "Hip extension & glute activation. Tracks hip height, back alignment and knee stability.",
  description_hi: "हिप एक्सटेंशन और ग्लूट्स को मजबूत करने के लिए।",
  cameraPosition: "side",
  cameraNote: "Position camera to your side so your full body profile is visible.",
  cameraNote_hi: "कैमरा साइड में रखें ताकि शरीर का प्रोफ़ाइल दिखे।",
  requiredLandmarks: [LM.LEFT_SHOULDER, LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE],
  targetReps: 10,
  jointRules: [
    {
      id: "knee-alignment",
      label: "Knee",
      label_hi: "घुटना",
      getLandmarkIndices: () => [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE],
      getAngle: (lms) => angleAt(at(lms, LM.LEFT_HIP), at(lms, LM.LEFT_KNEE), at(lms, LM.LEFT_ANKLE)),
      target: { min: 80, max: 100, tolerance: 15 },
      errorKey: "knee_alignment",
      phase: "always",
    },
  ],
  getPrimaryAngle: (lms) => {
    if (!visible(lms, [LM.LEFT_SHOULDER, LM.LEFT_HIP, LM.LEFT_KNEE])) return null;
    const shoulder = at(lms, LM.LEFT_SHOULDER);
    const hip = at(lms, LM.LEFT_HIP);
    const knee = at(lms, LM.LEFT_KNEE);
    const baselineY = (shoulder.y + knee.y) / 2;
    const elevation = (baselineY - hip.y) * 200; 
    return Math.max(0, Math.min(90, elevation));
  },
  startAngle: 5,
  startTolerance: 10,
  targetAngle: 30,
  targetTolerance: 15,
  startIsLower: false,
  evaluateForm: (lms) => {
    const isVisible = visible(lms, [LM.LEFT_SHOULDER, LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE]);
    if (!isVisible) return { visible: false, score: 60, formStatus: "warning", issues: [], angles: {} };
    const kneeAngle = angleAt(at(lms, LM.LEFT_HIP), at(lms, LM.LEFT_KNEE), at(lms, LM.LEFT_ANKLE));
    const hipAngle = angleAt(at(lms, LM.LEFT_SHOULDER), at(lms, LM.LEFT_HIP), at(lms, LM.LEFT_KNEE));
    const issues: string[] = [];
    if (kneeAngle < 60 || kneeAngle > 115) issues.push("knee_alignment");
    if (hipAngle < 150) issues.push("back_arch");
    const lHip = at(lms, LM.LEFT_HIP), rHip = at(lms, LM.RIGHT_HIP);
    if (Math.abs(lHip.y - rHip.y) > 0.05) issues.push("hip_drop");
    const score = scoreFromIssues(issues.length, 3);
    return { visible: true, score, formStatus: statusFromScore(score), issues, angles: { "Knee": Math.round(kneeAngle), "Hip": Math.round(hipAngle) } };
  },
  instructionSteps: [
    { title: "Starting Position", description: "Lie on your back with knees bent approximately 90°.", title_hi: "शुरुआती स्थिति", description_hi: "पीठ के बल लेटें और घुटने मोड़ें।", icon: "🛏️" },
    { title: "Engage & Lift", description: "Tighten your glutes and core. Slowly lift your hips.", title_hi: "उठाएं", description_hi: "हिप्स को धीरे-धीरे ऊपर उठाएं।", icon: "⬆️" },
    { title: "Hold at Top", description: "Hold the bridge position.", title_hi: "ऊपर रुकें", description_hi: "ऊपर थोड़ी देर रुकें।", icon: "🏗️" },
    { title: "Lower Slowly", description: "Slowly lower your hips back to the floor.", title_hi: "नीचे आएं", description_hi: "धीरे से वापस नीचे आएं।", icon: "⬇️" },
  ],
  commonMistakes: ["Excessive lower back arching", "Knees falling inward", "Hips dropping to one side"],
  commonMistakes_hi: ["कमर का बहुत ज्यादा मुड़ना", "घुटनों का अंदर गिरना", "हिप्स का एक तरफ झुकना"],
  corrections: {
    back_arch: { en: "Do not arch your back — keep your core tight.", hi: "कमर ज्यादा न मोड़ें — कोर कसकर रखें।" },
    knee_alignment: { en: "Keep your knees aligned — do not let them fall in.", hi: "घुटने संरेखित रखें — अंदर न आने दें।" },
    hip_drop: { en: "Keep both hips level — do not tilt to one side.", hi: "दोनों हिप्स स्तर पर रखें — एक तरफ न झुकें।" },
  },
  positiveRep: { en: "Great bridge! Well controlled.", hi: "शानदार ब्रिज! बहुत नियंत्रित।" },
  goodForm: { en: "Perfect form! Keep your core engaged.", hi: "बिलकुल सही फॉर्म! कोर कसकर रखें।" },
};

// 4. BICEP CURL
const BICEP_CURL: ExerciseConfig = {
  id: "bicep-curl",
  name: "Bicep Curl",
  name_hi: "बाइसेप कर्ल (Bicep Curl)",
  category: "upper-body",
  difficulty: "beginner",
  targetJoint: "Elbow",
  targetJoint_hi: "कोहनी (Elbow)",
  description: "Arm exercise targeting the biceps. Tracks elbow flexion and shoulder stability.",
  description_hi: "बाइसेप्स को मजबूत करने के लिए बेहतरीन व्यायाम।",
  cameraPosition: "side",
  cameraNote: "Stand sideways so your arm is fully visible.",
  cameraNote_hi: "साइड में खड़े हों ताकि हाथ पूरी तरह से दिखे।",
  requiredLandmarks: [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST],
  targetReps: 10,
  jointRules: [
    {
      id: "shoulder-stable",
      label: "Shoulder",
      label_hi: "कंधा",
      getLandmarkIndices: () => [LM.LEFT_HIP, LM.LEFT_SHOULDER, LM.LEFT_ELBOW],
      getAngle: (lms) => angleAt(at(lms, LM.LEFT_HIP), at(lms, LM.LEFT_SHOULDER), at(lms, LM.LEFT_ELBOW)),
      target: { min: 0, max: 25, tolerance: 10 },
      errorKey: "elbow_swing",
      phase: "always",
    },
  ],
  getPrimaryAngle: (lms) => {
    if (!visible(lms, [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST])) return null;
    return angleAt(at(lms, LM.LEFT_SHOULDER), at(lms, LM.LEFT_ELBOW), at(lms, LM.LEFT_WRIST));
  },
  startAngle: 165,
  startTolerance: 15,
  targetAngle: 45,
  targetTolerance: 20,
  startIsLower: false,
  evaluateForm: (lms) => {
    const isVisible = visible(lms, [LM.LEFT_HIP, LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST]);
    if (!isVisible) return { visible: false, score: 60, formStatus: "warning", issues: [], angles: {} };
    const elbowAngle = angleAt(at(lms, LM.LEFT_SHOULDER), at(lms, LM.LEFT_ELBOW), at(lms, LM.LEFT_WRIST));
    const shoulderAngle = angleAt(at(lms, LM.LEFT_HIP), at(lms, LM.LEFT_SHOULDER), at(lms, LM.LEFT_ELBOW));
    const issues: string[] = [];
    if (shoulderAngle > 30) issues.push("elbow_swing");
    const score = scoreFromIssues(issues.length, 2);
    return {
      visible: true, score, formStatus: statusFromScore(score), issues, angles: { "Elbow": Math.round(elbowAngle) }
    };
  },
  instructionSteps: [
    { title: "Start", description: "Stand straight with arms fully extended.", title_hi: "शुरुआत", description_hi: "सीधे खड़े हों और हाथ सीधे नीचे रखें।", icon: "🧍" },
    { title: "Curl", description: "Bend your elbows to lift the weight towards your shoulders.", title_hi: "कर्ल", description_hi: "कोहनी मोड़कर हाथों को कंधों की ओर लाएं।", icon: "💪" },
    { title: "Lower", description: "Slowly lower back to starting position.", title_hi: "नीचे लाएं", description_hi: "धीरे से वापस शुरुआत की स्थिति में आएं।", icon: "⬇️" },
  ],
  commonMistakes: ["Swinging the elbows forward", "Arching the back"],
  commonMistakes_hi: ["कोहनी को आगे झुलाना", "कमर को पीछे मोड़ना"],
  corrections: {
    elbow_swing: { en: "Keep your elbows pinned to your sides.", hi: "अपनी कोहनियों को शरीर के पास रखें।" }
  },
  positiveRep: { en: "Good curl!", hi: "बहुत बढ़िया कर्ल!" },
  goodForm: { en: "Perfect control!", hi: "बढ़िया नियंत्रण!" },
};

// 5. SHOULDER ABDUCTION
const SHOULDER_ABDUCTION: ExerciseConfig = {
  id: "shoulder-abduction",
  name: "Shoulder Abduction",
  name_hi: "शोल्डर एबडक्शन (Shoulder Abduction)",
  category: "upper-body",
  difficulty: "beginner",
  targetJoint: "Shoulder",
  targetJoint_hi: "कंधा (Shoulder)",
  description: "Lifting the arm away from the body. Great for shoulder mobility.",
  description_hi: "हाथ को शरीर से दूर उठाने वाला व्यायाम।",
  cameraPosition: "front",
  cameraNote: "Stand facing the camera so both arms are visible.",
  cameraNote_hi: "कैमरे के सामने खड़े हों ताकि दोनों हाथ दिखें।",
  requiredLandmarks: [LM.LEFT_HIP, LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST],
  targetReps: 10,
  jointRules: [
    {
      id: "arm-straight",
      label: "Elbow",
      label_hi: "कोहनी",
      getLandmarkIndices: () => [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST],
      getAngle: (lms) => angleAt(at(lms, LM.LEFT_SHOULDER), at(lms, LM.LEFT_ELBOW), at(lms, LM.LEFT_WRIST)),
      target: { min: 160, max: 180, tolerance: 15 },
      errorKey: "arm_bend",
      phase: "always",
    },
  ],
  getPrimaryAngle: (lms) => {
    if (!visible(lms, [LM.LEFT_HIP, LM.LEFT_SHOULDER, LM.LEFT_ELBOW])) return null;
    return angleAt(at(lms, LM.LEFT_HIP), at(lms, LM.LEFT_SHOULDER), at(lms, LM.LEFT_ELBOW));
  },
  startAngle: 15,
  startTolerance: 15,
  targetAngle: 90,
  targetTolerance: 15,
  startIsLower: true, // Primary angle INCREASES to reach target (15 -> 90)
  evaluateForm: (lms) => {
    const isVisible = visible(lms, [LM.LEFT_HIP, LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST]);
    if (!isVisible) return { visible: false, score: 60, formStatus: "warning", issues: [], angles: {} };
    const shoulderAngle = angleAt(at(lms, LM.LEFT_HIP), at(lms, LM.LEFT_SHOULDER), at(lms, LM.LEFT_ELBOW));
    const elbowAngle = angleAt(at(lms, LM.LEFT_SHOULDER), at(lms, LM.LEFT_ELBOW), at(lms, LM.LEFT_WRIST));
    const issues: string[] = [];
    if (elbowAngle < 150) issues.push("arm_bend");
    const score = scoreFromIssues(issues.length, 2);
    return {
      visible: true, score, formStatus: statusFromScore(score), issues, angles: { "Shoulder": Math.round(shoulderAngle) }
    };
  },
  instructionSteps: [
    { title: "Start", description: "Stand straight, arms by your side.", title_hi: "शुरुआत", description_hi: "सीधे खड़े हों, हाथ साइड में।", icon: "🧍" },
    { title: "Raise Arm", description: "Raise your arm to the side until it's parallel to the floor.", title_hi: "हाथ उठाएं", description_hi: "हाथ को साइड से तब तक उठाएं जब तक ज़मीन के समानांतर न हो जाए।", icon: "⬆️" },
    { title: "Lower Arm", description: "Slowly lower your arm back down.", title_hi: "हाथ नीचे करें", description_hi: "धीरे से हाथ को वापस नीचे लाएं।", icon: "⬇️" },
  ],
  commonMistakes: ["Bending the elbow", "Shrugging the shoulders"],
  commonMistakes_hi: ["कोहनी मोड़ना", "कंधों को ऊपर उचकाना"],
  corrections: {
    arm_bend: { en: "Keep your arm straight.", hi: "अपना हाथ सीधा रखें।" }
  },
  positiveRep: { en: "Good raise!", hi: "बढ़िया!" },
  goodForm: { en: "Perfect form!", hi: "बिलकुल सही फॉर्म!" },
};

// 6. OVERHEAD PRESS
const OVERHEAD_PRESS: ExerciseConfig = {
  id: "overhead-press",
  name: "Overhead Press",
  name_hi: "ओवरहेड प्रेस (Overhead Press)",
  category: "upper-body",
  difficulty: "intermediate",
  targetJoint: "Shoulder",
  targetJoint_hi: "कंधा (Shoulder)",
  description: "Pressing weight overhead. Tracks shoulder extension and arm straightness.",
  description_hi: "हाथों को सिर के ऊपर ले जाने वाला व्यायाम।",
  cameraPosition: "front",
  cameraNote: "Stand facing the camera so full arm extension is visible.",
  cameraNote_hi: "कैमरे के सामने खड़े हों ताकि हाथ का पूरा उठना दिखे।",
  requiredLandmarks: [LM.LEFT_HIP, LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST],
  targetReps: 10,
  jointRules: [
    {
      id: "arm-straight",
      label: "Elbow Extension",
      label_hi: "कोहनी का सीधा होना",
      getLandmarkIndices: () => [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST],
      getAngle: (lms) => angleAt(at(lms, LM.LEFT_SHOULDER), at(lms, LM.LEFT_ELBOW), at(lms, LM.LEFT_WRIST)),
      target: { min: 160, max: 180, tolerance: 20 },
      errorKey: "elbow_bend",
      phase: "target",
    },
  ],
  getPrimaryAngle: (lms) => {
    if (!visible(lms, [LM.LEFT_HIP, LM.LEFT_SHOULDER, LM.LEFT_ELBOW])) return null;
    return angleAt(at(lms, LM.LEFT_HIP), at(lms, LM.LEFT_SHOULDER), at(lms, LM.LEFT_ELBOW));
  },
  startAngle: 90,
  startTolerance: 20,
  targetAngle: 170,
  targetTolerance: 15,
  startIsLower: true,
  evaluateForm: (lms) => {
    const isVisible = visible(lms, [LM.LEFT_HIP, LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST]);
    if (!isVisible) return { visible: false, score: 60, formStatus: "warning", issues: [], angles: {} };
    const shoulderAngle = angleAt(at(lms, LM.LEFT_HIP), at(lms, LM.LEFT_SHOULDER), at(lms, LM.LEFT_ELBOW));
    const elbowAngle = angleAt(at(lms, LM.LEFT_SHOULDER), at(lms, LM.LEFT_ELBOW), at(lms, LM.LEFT_WRIST));
    const issues: string[] = [];
    if (shoulderAngle > 150 && elbowAngle < 150) issues.push("elbow_bend");
    const score = scoreFromIssues(issues.length, 2);
    return {
      visible: true, score, formStatus: statusFromScore(score), issues, angles: { "Shoulder": Math.round(shoulderAngle) }
    };
  },
  instructionSteps: [
    { title: "Start", description: "Arms bent at shoulder level.", title_hi: "शुरुआत", description_hi: "हाथों को कंधों के स्तर पर मोड़कर रखें।", icon: "💪" },
    { title: "Press", description: "Push your arms straight up overhead.", title_hi: "प्रेस", description_hi: "हाथों को सीधे सिर के ऊपर धकेलें।", icon: "⬆️" },
    { title: "Lower", description: "Lower back to shoulder level slowly.", title_hi: "नीचे लाएं", description_hi: "धीरे से वापस कंधों के स्तर तक लाएं।", icon: "⬇️" },
  ],
  commonMistakes: ["Arching the lower back excessively", "Not fully extending the arms"],
  commonMistakes_hi: ["कमर को बहुत ज्यादा पीछे मोड़ना", "हाथों को पूरा सीधा न करना"],
  corrections: {
    elbow_bend: { en: "Extend your arms fully at the top.", hi: "ऊपर हाथ पूरे सीधे करें।" }
  },
  positiveRep: { en: "Good press!", hi: "बढ़िया प्रेस!" },
  goodForm: { en: "Great extension!", hi: "बढ़िया एक्सटेंशन!" },
};

// 7. PLANK
const PLANK: ExerciseConfig = {
  id: "plank",
  name: "Plank",
  name_hi: "प्लैंक (Plank)",
  category: "core",
  difficulty: "intermediate",
  targetJoint: "Core / Spine",
  targetJoint_hi: "कोर / रीढ़",
  description: "Core stability exercise. Tracks hip alignment.",
  description_hi: "कोर की ताकत और स्थिरता के लिए।",
  cameraPosition: "side",
  cameraNote: "Position camera sideways so your entire body length is visible.",
  cameraNote_hi: "कैमरा साइड में रखें ताकि शरीर की पूरी लंबाई दिखे।",
  requiredLandmarks: [LM.LEFT_SHOULDER, LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE],
  targetReps: 1, // Time-based hold
  holdDuration: 30,
  jointRules: [
    {
      id: "body-straight",
      label: "Body Alignment",
      label_hi: "शरीर का सीधा होना",
      getLandmarkIndices: () => [LM.LEFT_SHOULDER, LM.LEFT_HIP, LM.LEFT_KNEE],
      getAngle: (lms) => angleAt(at(lms, LM.LEFT_SHOULDER), at(lms, LM.LEFT_HIP), at(lms, LM.LEFT_KNEE)),
      target: { min: 160, max: 180, tolerance: 15 },
      errorKey: "hip_sag",
      phase: "always",
    },
  ],
  getPrimaryAngle: (lms) => {
    if (!visible(lms, [LM.LEFT_SHOULDER, LM.LEFT_HIP, LM.LEFT_KNEE])) return null;
    return angleAt(at(lms, LM.LEFT_SHOULDER), at(lms, LM.LEFT_HIP), at(lms, LM.LEFT_KNEE));
  },
  startAngle: 175,
  startTolerance: 15,
  targetAngle: 175,
  targetTolerance: 15,
  startIsLower: false,
  evaluateForm: (lms) => {
    const isVisible = visible(lms, [LM.LEFT_SHOULDER, LM.LEFT_HIP, LM.LEFT_KNEE]);
    if (!isVisible) return { visible: false, score: 60, formStatus: "warning", issues: [], angles: {} };
    const hipAngle = angleAt(at(lms, LM.LEFT_SHOULDER), at(lms, LM.LEFT_HIP), at(lms, LM.LEFT_KNEE));
    const issues: string[] = [];
    if (hipAngle < 150) issues.push("hip_sag");
    const score = scoreFromIssues(issues.length, 2);
    return {
      visible: true, score, formStatus: statusFromScore(score), issues, angles: { "Hip Alignment": Math.round(hipAngle) }
    };
  },
  instructionSteps: [
    { title: "Setup", description: "Get into a pushup position but rest on your forearms.", title_hi: "तैयारी", description_hi: "पुशअप की स्थिति में आएं लेकिन अपनी कोहनियों पर टिकें।", icon: "💪" },
    { title: "Hold", description: "Keep your body in a straight line from head to heels.", title_hi: "रुकें", description_hi: "अपने शरीर को सिर से एड़ी तक एक सीधी रेखा में रखें।", icon: "⏱️" },
  ],
  commonMistakes: ["Hips sagging down", "Hips raised too high in the air"],
  commonMistakes_hi: ["हिप्स का नीचे लटकना", "हिप्स का हवा में बहुत ऊपर उठना"],
  corrections: {
    hip_sag: { en: "Keep your body straight, don't let your hips sag.", hi: "अपनी हिप्स को नीचे न गिरने दें, शरीर सीधी रखें।" }
  },
  positiveRep: { en: "Good hold!", hi: "बढ़िया होल्ड!" },
  goodForm: { en: "Excellent core control!", hi: "बढ़िया कोर नियंत्रण!" },
};

// 8. SIT-TO-STAND
const SIT_TO_STAND: ExerciseConfig = {
  id: "sit-to-stand",
  name: "Sit-to-Stand",
  name_hi: "सिट-टू-स्टैंड (Sit-to-Stand)",
  category: "knee",
  difficulty: "beginner",
  targetJoint: "Knee",
  targetJoint_hi: "घुटना (Knee)",
  description: "Functional exercise. Tracks knee tracking, weight symmetry and trunk lean.",
  description_hi: "कुर्सी से उठने और बैठने का व्यायाम।",
  cameraPosition: "front",
  cameraNote: "Position camera in front of you so your full body is visible from seated to standing.",
  cameraNote_hi: "कैमरा सामने रखें ताकि बैठकर उठने की पूरी गतिविधि दिखाई दे।",
  requiredLandmarks: [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_HIP, LM.RIGHT_KNEE],
  targetReps: 10,
  jointRules: [
    {
      id: "knee-tracking",
      label: "Left Knee",
      label_hi: "बायां घुटना",
      getLandmarkIndices: () => [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE],
      getAngle: (lms) => angleAt(at(lms, LM.LEFT_HIP), at(lms, LM.LEFT_KNEE), at(lms, LM.LEFT_ANKLE)),
      target: { min: 80, max: 180, tolerance: 10 },
      errorKey: "knee_valgus",
      phase: "always",
    },
  ],
  getPrimaryAngle: (lms) => {
    if (!visible(lms, [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE])) return null;
    return angleAt(at(lms, LM.LEFT_HIP), at(lms, LM.LEFT_KNEE), at(lms, LM.LEFT_ANKLE));
  },
  startAngle: 90,
  startTolerance: 20,
  targetAngle: 165,
  targetTolerance: 15,
  startIsLower: true, // Wait, 90 to 165 means angle increases, so startIsLower is true!
  evaluateForm: (lms) => {
    const isVisible = visible(lms, [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE]);
    if (!isVisible) return { visible: false, score: 60, formStatus: "warning", issues: [], angles: {} };
    const lKneeAngle = angleAt(at(lms, LM.LEFT_HIP), at(lms, LM.LEFT_KNEE), at(lms, LM.LEFT_ANKLE));
    const rKneeAngle = angleAt(at(lms, LM.RIGHT_HIP), at(lms, LM.RIGHT_KNEE), at(lms, LM.RIGHT_ANKLE));
    const lKneeX = at(lms, LM.LEFT_KNEE).x;
    const lAnkleX = at(lms, LM.LEFT_ANKLE).x;
    const issues: string[] = [];
    if (Math.abs(lKneeX - lAnkleX) > 0.06) issues.push("knee_valgus");
    const score = scoreFromIssues(issues.length, 3);
    return { visible: true, score, formStatus: statusFromScore(score), issues, angles: { "L Knee": Math.round(lKneeAngle), "R Knee": Math.round(rKneeAngle) } };
  },
  instructionSteps: [
    { title: "Seated Position", description: "Sit near the front edge of the chair. Knees approximately 90°.", title_hi: "बैठने की स्थिति", description_hi: "कुर्सी के किनारे बैठें। घुटने 90° मुड़े हुए।", icon: "🪑" },
    { title: "Stand Up", description: "Push through your heels and stand up.", title_hi: "खड़े होना", description_hi: "एड़ी पर ज़ोर डालकर सीधे खड़े हों।", icon: "🧍" },
    { title: "Sit Down Slowly", description: "Reach back and slowly lower yourself.", title_hi: "धीरे बैठना", description_hi: "धीरे-धीरे वापस कुर्सी पर बैठें।", icon: "⬇️" },
  ],
  commonMistakes: ["Knees collapsing inward", "Using hands to push up"],
  commonMistakes_hi: ["घुटनों का अंदर की तरफ गिरना", "हाथों का सहारा लेकर उठना"],
  corrections: {
    knee_valgus: { en: "Keep your knees aligned with your toes.", hi: "घुटने उंगलियों की सीध में रखें।" },
    use_hands: { en: "Try to stand without using your hands.", hi: "हाथों का सहारा लिए बिना खड़े हों।" },
  },
  positiveRep: { en: "Good rep! Nice controlled movement.", hi: "बढ़िया! अच्छी नियंत्रित गतिविधि।" },
  goodForm: { en: "Great form! Knees tracking well.", hi: "शानदार फॉर्म! घुटने ठीक चल रहे हैं।" },
};

// 9. STRAIGHT LEG RAISE
const STRAIGHT_LEG_RAISE: ExerciseConfig = {
  id: "slr",
  name: "Straight Leg Raise",
  name_hi: "सीधा पैर उठाना (Straight Leg Raise)",
  category: "hip",
  difficulty: "beginner",
  targetJoint: "Hip",
  targetJoint_hi: "हिप (Hip)",
  description: "Hip flexor strength without knee load. Tracks leg angle and knee extension.",
  description_hi: "घुटने पर दबाव डाले बिना हिप्स की ताकत बढ़ाना।",
  cameraPosition: "side",
  cameraNote: "Position camera to your side so your full body is visible while lying down.",
  cameraNote_hi: "लेटते समय कैमरा साइड में रखें ताकि पूरा शरीर दिखे।",
  requiredLandmarks: [LM.LEFT_SHOULDER, LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE],
  targetReps: 10,
  jointRules: [
    {
      id: "knee-straight",
      label: "Knee",
      label_hi: "घुटना",
      getLandmarkIndices: () => [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE],
      getAngle: (lms) => angleAt(at(lms, LM.LEFT_HIP), at(lms, LM.LEFT_KNEE), at(lms, LM.LEFT_ANKLE)),
      target: { min: 165, max: 180, tolerance: 10 },
      errorKey: "knee_bend",
      phase: "always",
    },
  ],
  getPrimaryAngle: (lms) => {
    if (!visible(lms, [LM.LEFT_HIP, LM.LEFT_KNEE])) return null;
    const offset = verticalOffset(at(lms, LM.LEFT_KNEE), at(lms, LM.LEFT_HIP));
    return Math.max(0, Math.min(90, offset * 200));
  },
  startAngle: 5,
  startTolerance: 8,
  targetAngle: 35,
  targetTolerance: 15,
  startIsLower: true, // 5 to 35 -> increases
  evaluateForm: (lms) => {
    const isVisible = visible(lms, [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE]);
    if (!isVisible) return { visible: false, score: 60, formStatus: "warning", issues: [], angles: {} };
    const kneeAngle = angleAt(at(lms, LM.LEFT_HIP), at(lms, LM.LEFT_KNEE), at(lms, LM.LEFT_ANKLE));
    const hipAngle = angleAt(at(lms, LM.LEFT_SHOULDER), at(lms, LM.LEFT_HIP), at(lms, LM.LEFT_KNEE));
    const issues: string[] = [];
    if (kneeAngle < 160) issues.push("knee_bend");
    const legElevation = verticalOffset(at(lms, LM.LEFT_KNEE), at(lms, LM.LEFT_HIP)) * 200;
    if (legElevation > 55) issues.push("too_high");
    const score = scoreFromIssues(issues.length, 3);
    return { visible: true, score, formStatus: statusFromScore(score), issues, angles: { "Knee": Math.round(kneeAngle), "Elevation": Math.round(legElevation) + "°" } };
  },
  instructionSteps: [
    { title: "Starting Position", description: "Lie flat on your back. One leg straight.", title_hi: "शुरुआती स्थिति", description_hi: "पीठ के बल सीधे लेटें। एक पैर सीधा रखें।", icon: "🛏️" },
    { title: "Raise Slowly", description: "Slowly raise the straight leg to 30–45°.", title_hi: "ऊपर उठाएं", description_hi: "सीधे पैर को 30-45 डिग्री तक धीरे-धीरे उठाएं।", icon: "⬆️" },
    { title: "Lower Slowly", description: "Slowly lower the leg back.", title_hi: "नीचे लाएं", description_hi: "पैर को धीरे-धीरे वापस लाएं।", icon: "⬇️" },
  ],
  commonMistakes: ["Knee bending during the lift", "Raising the leg too high (> 45°)"],
  commonMistakes_hi: ["उठाते समय घुटना मोड़ना", "पैर को बहुत ज्यादा ऊपर उठाना"],
  corrections: {
    knee_bend: { en: "Keep your knee straight — do not bend it.", hi: "अपना घुटना सीधा रखें — मोड़ें नहीं।" },
    too_high: { en: "Lower your leg slightly — stay within 30–45°.", hi: "अपना पैर थोड़ा नीचे रखें — 30–45° में रहिए।" },
  },
  positiveRep: { en: "Good repetition!", hi: "बहुत बढ़िया!" },
  goodForm: { en: "Great form! Keep going.", hi: "शानदार फॉर्म! जारी रखें।" },
};

// 10. CALF RAISES
const CALF_RAISES: ExerciseConfig = {
  id: "calf-raises",
  name: "Calf Raises",
  name_hi: "काफ रेज़ (Calf Raises)",
  category: "ankle",
  difficulty: "beginner",
  targetJoint: "Ankle",
  targetJoint_hi: "टखना (Ankle)",
  description: "Strengthens calf complex. Tracks heel rise, balance and ankle alignment.",
  description_hi: "पिंडलियों को मजबूत करने के लिए।",
  cameraPosition: "side",
  cameraNote: "Stand sideways to the camera so your ankle and heel are visible.",
  cameraNote_hi: "कैमरे के साइड में खड़े हों ताकि टखना और एड़ी दिखे।",
  requiredLandmarks: [LM.LEFT_KNEE, LM.LEFT_ANKLE, LM.LEFT_HEEL],
  targetReps: 15,
  jointRules: [
    {
      id: "ankle-alignment",
      label: "Ankle Alignment",
      label_hi: "टखने का सीधा होना",
      getLandmarkIndices: () => [LM.LEFT_ANKLE, LM.LEFT_HEEL],
      getAngle: (lms) => {
        const ankle = at(lms, LM.LEFT_ANKLE);
        const heel = at(lms, LM.LEFT_HEEL);
        return Math.abs(ankle.x - heel.x) * 200;
      },
      target: { min: 0, max: 10, tolerance: 5 },
      errorKey: "ankle_roll",
      phase: "always",
    },
  ],
  getPrimaryAngle: (lms) => {
    if (!visible(lms, [LM.LEFT_ANKLE, LM.LEFT_HEEL])) return null;
    const ankle = at(lms, LM.LEFT_ANKLE);
    const heel = at(lms, LM.LEFT_HEEL);
    const elevation = (ankle.y - heel.y) * 200; 
    return Math.max(0, Math.min(90, 50 + elevation));
  },
  startAngle: 45,
  startTolerance: 15,
  targetAngle: 70,
  targetTolerance: 15,
  startIsLower: true, // 45 to 70
  evaluateForm: (lms) => {
    const isVisible = visible(lms, [LM.LEFT_ANKLE, LM.LEFT_HEEL]);
    if (!isVisible) return { visible: false, score: 60, formStatus: "warning", issues: [], angles: {} };
    const lAnkle = at(lms, LM.LEFT_ANKLE);
    const lHeel = at(lms, LM.LEFT_HEEL);
    const issues: string[] = [];
    if (Math.abs(lAnkle.x - lHeel.x) > 0.03) issues.push("ankle_roll");
    const heelElev = (lAnkle.y - lHeel.y) * 200;
    const score = scoreFromIssues(issues.length, 2);
    return { visible: true, score, formStatus: statusFromScore(score), issues, angles: { "Heel Raise": Math.round(Math.max(0, heelElev)) + "°" } };
  },
  instructionSteps: [
    { title: "Starting Position", description: "Stand upright.", title_hi: "शुरुआती स्थिति", description_hi: "सीधे खड़े हों।", icon: "🧍" },
    { title: "Rise Up", description: "Slowly rise onto your toes.", title_hi: "ऊपर उठें", description_hi: "पैर की उंगलियों पर धीरे-धीरे ऊपर उठें।", icon: "⬆️" },
    { title: "Hold", description: "Pause at the top.", title_hi: "रुकें", description_hi: "ऊपर थोड़ी देर रुकें।", icon: "✅" },
    { title: "Lower Slowly", description: "Slowly lower your heels.", title_hi: "नीचे लाएं", description_hi: "धीरे से एड़ियां नीचे लाएं।", icon: "⬇️" },
  ],
  commonMistakes: ["Ankles rolling outward or inward", "Dropping heels too quickly"],
  commonMistakes_hi: ["टखनों का अंदर या बाहर की तरफ मुड़ना", "एड़ियों को बहुत तेज़ी से नीचे लाना"],
  corrections: {
    ankle_roll: { en: "Keep your ankles straight — do not roll them.", hi: "टखने सीधे रखें — उन्हें न घुमाएं।" },
  },
  positiveRep: { en: "Good rep!", hi: "बढ़िया दोहराव!" },
  goodForm: { en: "Great form!", hi: "शानदार फॉर्म!" },
};

// ─── Registry ──────────────────────────────────────────────────────────────────

export const EXERCISE_CONFIGS: Record<string, ExerciseConfig> = {
  "squat": SQUAT,
  "lunge": LUNGE,
  "glute-bridge": GLUTE_BRIDGE,
  "bicep-curl": BICEP_CURL,
  "shoulder-abduction": SHOULDER_ABDUCTION,
  "overhead-press": OVERHEAD_PRESS,
  "plank": PLANK,
  "sit-to-stand": SIT_TO_STAND,
  "slr": STRAIGHT_LEG_RAISE,
  "calf-raises": CALF_RAISES,
};

export const VISIBLE_EXERCISE_IDS = [
  "squat",
  "lunge",
  "glute-bridge",
  "bicep-curl",
  "shoulder-abduction",
  "overhead-press",
  "plank",
  "sit-to-stand",
  "slr",
  "calf-raises",
] as const;

export function getExerciseConfig(id: string): ExerciseConfig | undefined {
  return EXERCISE_CONFIGS[id] ?? EXERCISE_CONFIGS["squat"];
}

export function getVisibleExerciseConfigs(): ExerciseConfig[] {
  return VISIBLE_EXERCISE_IDS.map((id) => EXERCISE_CONFIGS[id]).filter(Boolean) as ExerciseConfig[];
}
