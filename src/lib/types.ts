export type Role = "patient" | "doctor" | "admin";
export type RequestStatus = "pending" | "approved" | "rejected";
export type PaymentStatus = "pending" | "paid" | "failed";
export type FormStatus = "good" | "warning" | "bad";

export interface PoseFrameResult {
  repCount: number;
  accuracy: number;
  formStatus: FormStatus;
  feedbackText: string;
}

export interface SessionSummary {
  sessionId: string;
  userId: string;
  exercise: string;
  date: string;
  accuracy: number;
  validReps: number;
  invalidReps: number;
  corrections: string[];
}

export interface DoctorConnectRequest {
  requestId: string;
  patientId: string;
  doctorId: string;
  condition: string;
  status: RequestStatus;
}

export interface ChatMessage {
  senderId: string;
  text: string;
  timestamp: string;
  flagged?: boolean;
}

export interface User {
  userId: string;
  name: string;
  role: Role;
}

export type ExerciseCategory = "ankle" | "knee" | "hip" | "balance" | "full-body" | "upper-body" | "core";

export interface ExerciseDef {
  id: string;
  name: string;
  description: string;
  category: ExerciseCategory;
  available: boolean;
  pose: string;
  mainJoint: string;
  movement: string;
  targetAngles: string;
  holdSeconds?: number;
  correctForm: string[];
  wrongForm: string[];
  repStart?: string;
  repEnd?: string;
}

export const EXERCISES: ExerciseDef[] = [
  {
    id: "squat",
    name: "Bodyweight Squat",
    category: "full-body",
    available: true,
    description: "AI-powered real-time squat form analysis with 3D joint tracking, valgus detection, and voice coaching.",
    pose: "Standing, feet shoulder-width apart, toes slightly outward.",
    mainJoint: "Knee / Hip / Spine",
    movement: "Hinge at hips → bend knees to ~90–100° → drive through heels back to standing.",
    targetAngles: "Knee flexion: 90–120° (±15° tolerance)",
    correctForm: [
      "Knees aligned over toes, no inward collapse",
      "Chest up, avoid excessive forward lean",
      "Heels flat on floor throughout",
    ],
    wrongForm: [
      "Knees collapsing inward (valgus)",
      "Chest leaning too far forward",
      "Not squatting deep enough",
      "Heels lifting off the floor",
    ],
    repStart: "Standing tall, knee ~165°",
    repEnd: "Knee reaches ~100° and returned to standing",
  },
  {
    id: "lunge",
    name: "Forward Lunge",
    category: "full-body",
    available: true,
    description: "Unilateral leg exercise for strengthening quads, glutes, and hamstrings.",
    pose: "Standing sideways to camera, feet together initially.",
    mainJoint: "Knee / Hip",
    movement: "Step forward → lower until front knee ~90° → push off front foot back.",
    targetAngles: "Front knee flexion: 80–100° (±15° tolerance)",
    correctForm: [
      "Front knee at ~90°, not past toes",
      "Upper body upright, no forward lean",
      "Back knee just above floor, not touching",
    ],
    wrongForm: [
      "Knee extending past toes",
      "Upper body leaning forward",
      "Back knee touching the floor",
    ],
    repStart: "Standing with feet together",
    repEnd: "Front knee bent to target and returned to standing",
  },
  {
    id: "glute-bridge",
    name: "Glute Bridge",
    category: "hip",
    available: true,
    description: "Hip extension & glute activation. Tracks hip height, back alignment and knee stability.",
    pose: "Lying on back, knees bent ~90°, feet flat on floor.",
    mainJoint: "Hip",
    movement: "Lift hips → shoulders-hips-knees straight line → lower slowly.",
    targetAngles: "Knee bend: 80–100° | Body angle: 160–180° (±15° tolerance)",
    correctForm: [
      "Shoulders-hips-knees in straight line at top",
      "Knees aligned, not falling inward",
      "Both hips level throughout",
    ],
    wrongForm: [
      "Excessive lower-back arching",
      "Knees falling inward",
      "Hips dropping to one side",
    ],
    repStart: "Hips on floor",
    repEnd: "Full hip extension reached and returned to floor",
  },
  {
    id: "bicep-curl",
    name: "Bicep Curl",
    category: "upper-body",
    available: true,
    description: "Arm exercise targeting the biceps. Tracks elbow flexion and shoulder stability.",
    pose: "Standing sideways, arms fully extended at sides.",
    mainJoint: "Elbow",
    movement: "Bend elbows → lift toward shoulders → lower slowly.",
    targetAngles: "Shoulder angle: 0–25° (±10° tolerance) | Elbow: 45–165°",
    correctForm: [
      "Elbows pinned to sides, no forward swing",
      "Back straight, no arching",
      "Controlled movement both ways",
    ],
    wrongForm: [
      "Swinging the elbows forward",
      "Arching the back",
    ],
    repStart: "Arms fully extended (elbow ~165°)",
    repEnd: "Elbow bent to ~45° and returned to extension",
  },
  {
    id: "shoulder-abduction",
    name: "Shoulder Abduction",
    category: "upper-body",
    available: true,
    description: "Lifting the arm away from the body. Great for shoulder mobility.",
    pose: "Standing facing camera, arms by your side initially.",
    mainJoint: "Shoulder",
    movement: "Raise arm to side → parallel with floor → lower slowly.",
    targetAngles: "Shoulder abduction: 15–90° (±15° tolerance) | Elbow: 160–180°",
    correctForm: [
      "Arm straight throughout movement",
      "Controlled raise and lower",
      "Shoulders relaxed, not shrugged",
    ],
    wrongForm: [
      "Bending the elbow",
      "Shrugging the shoulders",
    ],
    repStart: "Arm at side (shoulder ~15°)",
    repEnd: "Shoulder reaches ~90° and lowered back",
  },
  {
    id: "overhead-press",
    name: "Overhead Press",
    category: "upper-body",
    available: true,
    description: "Pressing weight overhead. Tracks shoulder extension and arm straightness.",
    pose: "Standing facing camera, arms bent at shoulder level initially.",
    mainJoint: "Shoulder",
    movement: "Press arms straight overhead → lower back to shoulder level.",
    targetAngles: "Shoulder: 90–170° (±15–20°) | Elbow extension at top: 160–180°",
    correctForm: [
      "Arms fully extended overhead at top",
      "Core tight, no excessive back arch",
      "Controlled press and lower",
    ],
    wrongForm: [
      "Arching the lower back excessively",
      "Not fully extending the arms",
    ],
    repStart: "Arms bent at shoulder level",
    repEnd: "Arms fully overhead and returned to shoulder level",
  },
  {
    id: "plank",
    name: "Plank",
    category: "core",
    available: true,
    description: "Core stability exercise. Tracks hip alignment.",
    pose: "Forearms on floor, body in straight line from head to heels.",
    mainJoint: "Core / Spine",
    movement: "Hold static position for target duration (isometric).",
    targetAngles: "Body alignment (shoulder-hip-knee): 160–180° (±15°)",
    holdSeconds: 30,
    correctForm: [
      "Body in straight line head to heels",
      "Core engaged throughout",
      "Hips neither sagging nor raised high",
    ],
    wrongForm: [
      "Hips sagging down",
      "Hips raised too high in the air",
    ],
    repStart: "Plank position assumed",
    repEnd: "30 second hold completed",
  },
  {
    id: "sit-to-stand",
    name: "Sit-to-Stand",
    category: "knee",
    available: true,
    description: "Functional exercise. Tracks knee tracking, weight symmetry and trunk lean.",
    pose: "Seated near front edge of chair, feet flat, hip-width apart.",
    mainJoint: "Knee",
    movement: "Sit (knee ~90°+) → stand (knee ~165°) → sit.",
    targetAngles: "Knee angle: 90°+ → 165° standing (±10–20°)",
    correctForm: [
      "Knees aligned over toes",
      "Weight even on both feet",
      "Controlled sitting back to chair",
    ],
    wrongForm: [
      "Knees collapsing inward",
      "Using hands to push up",
    ],
    repStart: "Fully seated (knee ~90°)",
    repEnd: "Fully standing and returned to seated",
  },
  {
    id: "slr",
    name: "Straight Leg Raise",
    category: "hip",
    available: true,
    description: "Hip flexor strength without knee load. Tracks leg angle and knee extension.",
    pose: "Lying on back. One leg straight, other bent for support if needed.",
    mainJoint: "Hip",
    movement: "Raise straight leg slowly to 30–45° → lower back down.",
    targetAngles: "Leg elevation: 35° target (±15°) | Knee: 165–180° (±10°)",
    correctForm: [
      "Knee fully extended throughout lift",
      "Smooth controlled lift and lower",
      "Lower back stays on floor",
    ],
    wrongForm: [
      "Knee bending during the lift",
      "Raising the leg too high (> 45°",
    ],
    repStart: "Leg flat on floor",
    repEnd: "Hip reaches ~35° and lowered back",
  },
  {
    id: "calf-raises",
    name: "Calf Raises",
    category: "ankle",
    available: true,
    description: "Strengthens calf complex. Tracks heel rise, balance and ankle alignment.",
    pose: "Standing, feet approximately hip-width apart.",
    mainJoint: "Ankle",
    movement: "Heels lift → rise onto toes → slowly lower.",
    targetAngles: "Heel elevation from ankle: substantial rise (±15° tolerance) | Ankle alignment 0–10°",
    correctForm: [
      "Body moves vertically upward",
      "Equal weight through both feet",
      "Ankles stay neutral — no rolling",
    ],
    wrongForm: [
      "Ankles rolling outward or inward",
      "Dropping heels too quickly",
    ],
    repStart: "Heels on floor (neutral ankle)",
    repEnd: "Maximum comfortable heel rise achieved",
  },
];
