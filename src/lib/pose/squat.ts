/**
 * Legacy compatibility re-export layer.
 * Delegates to the unified SquatEngine in src/lib/pose/squat/engine.ts.
 */

export type { Landmark } from "@/lib/exercises/angleUtils";
export { LM, POSE_CONNECTIONS, angleAt } from "@/lib/exercises/angleUtils";
export { SquatEngine } from "./squat/engine";
export { DEFAULT_SQUAT_CONFIG as SQUAT_TARGETS } from "./squat/config";
export { SquatRepCounter } from "./squat/repCounter";

