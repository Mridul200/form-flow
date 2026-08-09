/**
 * Squat Phase Detector State Machine with Hysteresis.
 * Tracks movement phases: STANDING -> DESCENDING -> BOTTOM -> ASCENDING -> STANDING.
 */

import type { SquatConfig } from "./config";

export type SquatPhase = "STANDING" | "DESCENDING" | "BOTTOM" | "ASCENDING";

export interface PhaseDetectorResult {
  phase: SquatPhase;
  minKneeAngleInRep: number;
  maxKneeAngleInRep: number;
  phaseChanged: boolean;
}

export class SquatPhaseDetector {
  private phase: SquatPhase = "STANDING";
  private minKneeAngle = 180;
  private maxKneeAngle = 180;
  private config: SquatConfig;

  constructor(config: SquatConfig) {
    this.config = config;
  }

  update(avgKneeAngle: number, kneeVelocity: number): PhaseDetectorResult {
    let phaseChanged = false;
    const oldPhase = this.phase;
    const { angles, hysteresis } = this.config;

    this.minKneeAngle = Math.min(this.minKneeAngle, avgKneeAngle);
    this.maxKneeAngle = Math.max(this.maxKneeAngle, avgKneeAngle);

    // Capture current rep bounds before any reset
    const repMinKnee = this.minKneeAngle;
    const repMaxKnee = this.maxKneeAngle;

    switch (this.phase) {
      case "STANDING":
        // Enter DESCENDING if knee flexes below threshold with negative velocity
        if (avgKneeAngle < angles.enterDescendKnee && kneeVelocity < -5) {
          this.phase = "DESCENDING";
          this.minKneeAngle = avgKneeAngle;
          this.maxKneeAngle = avgKneeAngle;
        }
        break;

      case "DESCENDING":
        // Enter BOTTOM if knee angle drops near target depth or velocity flips positive
        if (avgKneeAngle <= angles.minDepthKnee || (kneeVelocity >= -2 && avgKneeAngle < angles.minDepthKnee + 15)) {
          this.phase = "BOTTOM";
        }
        // Exit back to STANDING if user aborted early with hysteresis
        else if (avgKneeAngle > angles.enterDescendKnee + hysteresis.kneePhaseDelta) {
          this.phase = "STANDING";
        }
        break;

      case "BOTTOM":
        // Enter ASCENDING as knee begins extending (positive velocity)
        if (kneeVelocity > 5 || avgKneeAngle > this.minKneeAngle + 8) {
          this.phase = "ASCENDING";
        }
        break;

      case "ASCENDING":
        // Return to STANDING with hysteresis once knees extend past standing threshold
        if (avgKneeAngle >= angles.standKnee) {
          this.phase = "STANDING";
          // Reset min/max for next rep AFTER capturing current rep bounds above
          this.minKneeAngle = avgKneeAngle;
          this.maxKneeAngle = avgKneeAngle;
        }
        break;
    }

    if (this.phase !== oldPhase) {
      phaseChanged = true;
    }

    return {
      phase: this.phase,
      minKneeAngleInRep: repMinKnee,
      maxKneeAngleInRep: repMaxKnee,
      phaseChanged,
    };
  }

  getPhase(): SquatPhase {
    return this.phase;
  }

  resetRepBounds(currentAngle: number) {
    this.minKneeAngle = currentAngle;
    this.maxKneeAngle = currentAngle;
  }

  reset() {
    this.phase = "STANDING";
    this.minKneeAngle = 180;
    this.maxKneeAngle = 180;
  }
}
