/**
 * Intelligent Repetition and Hold Counter.
 * Uses a robust state machine (START -> MOVING -> TARGET -> RETURNING -> COMPLETE)
 * to count reps and track isometric hold times.
 */

import type { Landmark } from "./angleUtils";
import type { ExerciseConfig, RepPhase } from "./config";
import type { FormStatus } from "@/lib/types";

export interface RepCounterState {
  repCount: number;
  validReps: number;
  invalidReps: number;
  phase: RepPhase;
  holdSecondsLeft: number;
  currentProgress: number; // 0 to 100% towards target
  topCorrections: string[];
}

export class ExerciseRepCounter {
  private config: ExerciseConfig;
  private phase: RepPhase = "idle";
  private repHadBadForm = false;
  private holdTimer: number | null = null;
  private holdStartTimestamp: number | null = null;
  private holdSecondsRemaining = 0;

  validReps = 0;
  invalidReps = 0;
  correctionsMap = new Map<string, number>();

  constructor(config: ExerciseConfig) {
    this.config = config;
    if (config.holdDuration) {
      this.holdSecondsRemaining = config.holdDuration;
    }
  }

  update(
    lms: Landmark[],
    formStatus: FormStatus,
    issues: string[]
  ): { event: "rep_complete" | "rep_failed" | "hold_tick" | null; valid: boolean } {
    // Record issues
    for (const issue of issues) {
      this.correctionsMap.set(issue, (this.correctionsMap.get(issue) ?? 0) + 1);
    }

    if (formStatus === "bad") {
      this.repHadBadForm = true;
    }

    const primaryAngle = this.config.getPrimaryAngle(lms);
    if (primaryAngle === null) {
      return { event: null, valid: false };
    }

    const { startAngle, startTolerance, targetAngle, targetTolerance, holdDuration } =
      this.config;

    // Handle Isometric Hold Exercises (e.g. Quad Sets, Single-Leg Balance)
    if (holdDuration) {
      const isAtTarget =
        Math.abs(primaryAngle - targetAngle) <= targetTolerance && formStatus !== "bad";

      if (isAtTarget) {
        if (this.phase !== "at_target") {
          this.phase = "at_target";
          this.holdStartTimestamp = Date.now();
        } else if (this.holdStartTimestamp) {
          const elapsed = (Date.now() - this.holdStartTimestamp) / 1000;
          this.holdSecondsRemaining = Math.max(0, holdDuration - Math.floor(elapsed));

          if (elapsed >= holdDuration) {
            this.validReps += 1;
            this.phase = "idle";
            this.holdStartTimestamp = null;
            this.holdSecondsRemaining = holdDuration;
            return { event: "rep_complete", valid: true };
          }
        }
      } else {
        if (this.phase === "at_target") {
          this.phase = "idle";
          this.holdStartTimestamp = null;
          this.holdSecondsRemaining = holdDuration;
        }
      }
      return { event: null, valid: false };
    }

    // Handle Dynamic Repetition Exercises
    const isAtStart = Math.abs(primaryAngle - startAngle) <= startTolerance;
    const isAtTarget = Math.abs(primaryAngle - targetAngle) <= targetTolerance;

    let result: { event: "rep_complete" | "rep_failed" | null; valid: boolean } = {
      event: null,
      valid: false,
    };

    switch (this.phase) {
      case "idle":
        if (!isAtStart) {
          this.phase = "moving";
        }
        break;

      case "moving":
        if (isAtTarget) {
          this.phase = "at_target";
        } else if (isAtStart) {
          this.phase = "idle";
        }
        break;

      case "at_target":
        if (!isAtTarget) {
          this.phase = "returning";
        }
        break;

      case "returning":
        if (isAtStart) {
          this.phase = "idle";
          const isValid = !this.repHadBadForm;
          if (isValid) {
            this.validReps += 1;
            result = { event: "rep_complete", valid: true };
          } else {
            this.invalidReps += 1;
            result = { event: "rep_failed", valid: false };
          }
          this.repHadBadForm = false;
        }
        break;
    }

    return result;
  }

  getPhase(): RepPhase {
    return this.phase;
  }

  getHoldSecondsLeft(): number {
    return this.holdSecondsRemaining;
  }

  getTopCorrections(limit = 3): string[] {
    return [...this.correctionsMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key]) => key);
  }

  getProgress(lms: Landmark[]): number {
    const angle = this.config.getPrimaryAngle(lms);
    if (angle === null) return 0;
    const range = Math.abs(this.config.targetAngle - this.config.startAngle);
    if (range === 0) return 100;
    const dist = Math.abs(angle - this.config.startAngle);
    return Math.min(100, Math.round((dist / range) * 100));
  }
}
