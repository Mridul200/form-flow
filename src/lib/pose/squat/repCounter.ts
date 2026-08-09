/**
 * Stateful Squat Rep Counter & Rep Quality Score Accumulator.
 * Validates full phase sequence (STANDING -> DESCENDING -> BOTTOM -> ASCENDING -> STANDING)
 * and accumulates rep quality score across all frames of each rep.
 */

import type { SquatConfig } from "./config";
import type { SquatPhase } from "./phaseDetector";
import type { FormError, BiomechanicalFeatures } from "./squatRules";

export interface RepSummary {
  repNumber: number;
  valid: boolean;
  score: number; // 0 to 100%
  minKneeAngle: number;
  maxKneeAngle: number;
  rom: number;
  durationSec: number;
  dominantError: FormError | null;
  errors: string[];
}

export class SquatRepCounter {
  private config: SquatConfig;
  validReps = 0;
  invalidReps = 0;

  private currentRepScores: number[] = [];
  private currentRepErrors = new Map<string, FormError>();
  private lastRepCompletedTime = 0;
  private repStartTime = 0;

  completedReps: RepSummary[] = [];

  constructor(config: SquatConfig) {
    this.config = config;
  }

  updateFrame(
    phase: SquatPhase,
    features: BiomechanicalFeatures,
    errors: FormError[],
    minKneeAngleInRep: number,
    maxKneeAngleInRep: number,
    phaseChanged: boolean
  ): { event: "rep_complete" | "rep_failed" | null; rep: RepSummary | null } {
    const now = Date.now();

    // 1. Frame scoring (accumulate quality score)
    let frameScore = 100;
    for (const err of errors) {
      if (err.severity === "CRITICAL") frameScore -= 30;
      else if (err.severity === "MAJOR") frameScore -= 20;
      else if (err.severity === "MODERATE") frameScore -= 10;
      else if (err.severity === "MINOR") frameScore -= 5;
      this.currentRepErrors.set(err.ruleId, err);
    }
    frameScore = Math.max(0, Math.min(100, frameScore));

    if (phase !== "STANDING") {
      if (this.repStartTime === 0) this.repStartTime = now;
      this.currentRepScores.push(frameScore);
    }

    // 2. Rep Completion Trigger (ASCENDING -> STANDING)
    if (phaseChanged && phase === "STANDING" && this.currentRepScores.length > 0) {
      // Ensure cooldown debounce
      if (now - this.lastRepCompletedTime < this.config.rep.debounceMs) {
        this.resetRepState();
        return { event: null, rep: null };
      }

      const rom = maxKneeAngleInRep - minKneeAngleInRep;
      const durationSec = Math.max(0.5, (now - this.repStartTime) / 1000);
      const deepEnough = minKneeAngleInRep <= this.config.angles.minDepthKnee;
      const validROM = rom >= this.config.rep.minROM;

      const valid = deepEnough && validROM;

      const avgScore = this.currentRepScores.length
        ? Math.round(this.currentRepScores.reduce((a, b) => a + b, 0) / this.currentRepScores.length)
        : 100;

      // Find dominant error with highest severity
      let dominantError: FormError | null = null;
      for (const err of this.currentRepErrors.values()) {
        if (
          !dominantError ||
          this.severityWeight(err.severity) > this.severityWeight(dominantError.severity)
        ) {
          dominantError = err;
        }
      }

      const summary: RepSummary = {
        repNumber: this.validReps + this.invalidReps + 1,
        valid,
        score: avgScore,
        minKneeAngle: Math.round(minKneeAngleInRep),
        maxKneeAngle: Math.round(maxKneeAngleInRep),
        rom: Math.round(rom),
        durationSec: Number(durationSec.toFixed(1)),
        dominantError,
        errors: Array.from(this.currentRepErrors.keys()),
      };

      if (valid) {
        this.validReps += 1;
      } else {
        this.invalidReps += 1;
      }

      this.completedReps.push(summary);
      this.lastRepCompletedTime = now;
      this.resetRepState();

      return {
        event: valid ? "rep_complete" : "rep_failed",
        rep: summary,
      };
    }

    return { event: null, rep: null };
  }

  private severityWeight(severity: string): number {
    switch (severity) {
      case "CRITICAL": return 4;
      case "MAJOR": return 3;
      case "MODERATE": return 2;
      case "MINOR": return 1;
      default: return 0;
    }
  }

  private resetRepState() {
    this.currentRepScores = [];
    this.currentRepErrors.clear();
    this.repStartTime = 0;
  }

  getOverallScore(): number {
    if (!this.completedReps.length) return 100;
    const sum = this.completedReps.reduce((a, r) => a + r.score, 0);
    return Math.round(sum / this.completedReps.length);
  }

  getTopCorrections(limit = 3): string[] {
    const counts = new Map<string, number>();
    for (const rep of this.completedReps) {
      for (const errKey of rep.errors) {
        counts.set(errKey, (counts.get(errKey) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key]) => key);
  }

  reset() {
    this.validReps = 0;
    this.invalidReps = 0;
    this.completedReps = [];
    this.resetRepState();
  }
}
