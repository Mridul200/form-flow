/**
 * Squat Form Rules & Temporal Form Evaluation Engine.
 * Implements rule conditions, error persistence windows, and temporal error activation/clearance.
 */

import type { Landmark } from "@/lib/exercises/angleUtils";
import { LM, at, angleAt, angleAt3D, mid } from "@/lib/exercises/angleUtils";
import type { SquatConfig } from "./config";
import type { SquatPhase } from "./phaseDetector";

export type FormSeverity = "CRITICAL" | "MAJOR" | "MODERATE" | "MINOR" | "ENCOURAGEMENT";

export interface FormError {
  ruleId: string;
  bodyPart: "left_knee" | "right_knee" | "both_knees" | "torso" | "hips" | "full_body" | "camera";
  errorType: string;
  severity: FormSeverity;
  confidence: number;
  measuredValue: number;
  targetValue: number;
  messageEn: string;
  messageHi: string;
}

export interface BiomechanicalFeatures {
  leftKneeAngle: number;
  rightKneeAngle: number;
  avgKneeAngle: number;
  leftHipAngle: number;
  rightHipAngle: number;
  avgHipAngle: number;
  torsoLeanAngle: number;
  leftKneeValgusRatio: number;
  rightKneeValgusRatio: number;
  asymmetryDelta: number;
  kneeVelocity: number;
  is3D: boolean;
}

/** Compute biomechanical features from 33 landmarks. */
export function extractSquatFeatures(
  lms: Landmark[],
  prevKneeAngle: number | null,
  deltaTimeSec: number
): BiomechanicalFeatures {
  const lHip = at(lms, LM.LEFT_HIP);
  const rHip = at(lms, LM.RIGHT_HIP);
  const lKnee = at(lms, LM.LEFT_KNEE);
  const rKnee = at(lms, LM.RIGHT_KNEE);
  const lAnkle = at(lms, LM.LEFT_ANKLE);
  const rAnkle = at(lms, LM.RIGHT_ANKLE);
  const lShoulder = at(lms, LM.LEFT_SHOULDER);
  const rShoulder = at(lms, LM.RIGHT_SHOULDER);

  // Check if 3D depth (z) is available and valid
  const is3D = lms.some((lm) => lm.z !== undefined && lm.z !== 0);

  const leftKneeAngle = is3D ? angleAt3D(lHip, lKnee, lAnkle) : angleAt(lHip, lKnee, lAnkle);
  const rightKneeAngle = is3D ? angleAt3D(rHip, rKnee, rAnkle) : angleAt(rHip, rKnee, rAnkle);
  const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

  const leftHipAngle = is3D ? angleAt3D(lShoulder, lHip, lKnee) : angleAt(lShoulder, lHip, lKnee);
  const rightHipAngle = is3D ? angleAt3D(rShoulder, rHip, rKnee) : angleAt(rShoulder, rHip, rKnee);
  const avgHipAngle = (leftHipAngle + rightHipAngle) / 2;

  // Torso inclination away from vertical (0 = upright)
  const shoulderMid = mid(lShoulder, rShoulder);
  const hipMid = mid(lHip, rHip);
  const dx = Math.abs(shoulderMid.x - hipMid.x);
  const dy = Math.abs(shoulderMid.y - hipMid.y);
  const torsoLeanAngle = (Math.atan2(dx, dy) * 180) / Math.PI;

  // Knee valgus ratio (inward knee displacement relative to hip/ankle alignment)
  const hipWidth = Math.abs(lHip.x - rHip.x) || 0.2;
  const leftKneeValgusRatio = (lKnee.x - lHip.x) / hipWidth;
  const rightKneeValgusRatio = (rHip.x - rKnee.x) / hipWidth;

  // Symmetry delta between left and right knee angle
  const asymmetryDelta = Math.abs(leftKneeAngle - rightKneeAngle);

  // Angular velocity
  let kneeVelocity = 0;
  if (prevKneeAngle !== null && deltaTimeSec > 0) {
    kneeVelocity = (avgKneeAngle - prevKneeAngle) / deltaTimeSec;
  }

  return {
    leftKneeAngle: Math.round(leftKneeAngle),
    rightKneeAngle: Math.round(rightKneeAngle),
    avgKneeAngle: Math.round(avgKneeAngle),
    leftHipAngle: Math.round(leftHipAngle),
    rightHipAngle: Math.round(rightHipAngle),
    avgHipAngle: Math.round(avgHipAngle),
    torsoLeanAngle: Math.round(torsoLeanAngle),
    leftKneeValgusRatio: Number(leftKneeValgusRatio.toFixed(3)),
    rightKneeValgusRatio: Number(rightKneeValgusRatio.toFixed(3)),
    asymmetryDelta: Math.round(asymmetryDelta),
    kneeVelocity: Math.round(kneeVelocity),
    is3D,
  };
}

/** Raw rule evaluation for current frame features. */
export function evaluateSquatRules(
  features: BiomechanicalFeatures,
  phase: SquatPhase,
  config: SquatConfig
): FormError[] {
  const errors: FormError[] = [];
  const { angles } = config;

  // Rule 1: Forward Torso Lean (Check during DESCENDING, BOTTOM, ASCENDING)
  if (phase !== "STANDING") {
    if (features.torsoLeanAngle > angles.maxBackLean) {
      errors.push({
        ruleId: "FORWARD_TORSO_LEAN",
        bodyPart: "torso",
        errorType: "torso_lean",
        severity: "CRITICAL",
        confidence: 0.9,
        measuredValue: features.torsoLeanAngle,
        targetValue: angles.warnBackLean,
        messageEn: "Keep your chest up — back is leaning too far forward.",
        messageHi: "Apni chhati ko utha kar rakhein — peeth aage mat jhukayein.",
      });
    } else if (features.torsoLeanAngle > angles.warnBackLean) {
      errors.push({
        ruleId: "FORWARD_TORSO_LEAN",
        bodyPart: "torso",
        errorType: "torso_lean",
        severity: "MODERATE",
        confidence: 0.85,
        measuredValue: features.torsoLeanAngle,
        targetValue: angles.warnBackLean,
        messageEn: "Slight forward lean — keep your chest upright.",
        messageHi: "Thoda aage jhukav hai — chhati seedhi rakhein.",
      });
    }
  }

  // Rule 2: Knee Valgus / Inward Collapse
  if (phase === "DESCENDING" || phase === "BOTTOM" || phase === "ASCENDING") {
    const leftValgus = features.leftKneeValgusRatio > angles.maxKneeValgus;
    const rightValgus = features.rightKneeValgusRatio > angles.maxKneeValgus;

    if (leftValgus && rightValgus) {
      errors.push({
        ruleId: "BOTH_KNEES_VALGUS",
        bodyPart: "both_knees",
        errorType: "knee_valgus",
        severity: "CRITICAL",
        confidence: 0.95,
        measuredValue: Math.max(features.leftKneeValgusRatio, features.rightKneeValgusRatio),
        targetValue: angles.warnKneeValgus,
        messageEn: "Push both knees outward — keep them aligned over your toes.",
        messageHi: "Dono ghutno ko bahar rakhein — toes ke upar align karein.",
      });
    } else if (leftValgus) {
      errors.push({
        ruleId: "LEFT_KNEE_VALGUS",
        bodyPart: "left_knee",
        errorType: "knee_valgus",
        severity: "MAJOR",
        confidence: 0.9,
        measuredValue: features.leftKneeValgusRatio,
        targetValue: angles.warnKneeValgus,
        messageEn: "Keep your left knee aligned with your foot — do not cave in.",
        messageHi: "Bayein ghutne ko pair ke saath seedha rakhein.",
      });
    } else if (rightValgus) {
      errors.push({
        ruleId: "RIGHT_KNEE_VALGUS",
        bodyPart: "right_knee",
        errorType: "knee_valgus",
        severity: "MAJOR",
        confidence: 0.9,
        measuredValue: features.rightKneeValgusRatio,
        targetValue: angles.warnKneeValgus,
        messageEn: "Keep your right knee aligned with your foot — do not cave in.",
        messageHi: "Dayein ghutne ko pair ke saath seedha rakhein.",
      });
    }
  }

  // Rule 3: Shallow Depth (Checked at BOTTOM)
  if (phase === "BOTTOM" && features.avgKneeAngle > angles.minDepthKnee) {
    errors.push({
      ruleId: "SQUAT_DEPTH",
      bodyPart: "hips",
      errorType: "too_shallow",
      severity: "MAJOR",
      confidence: 0.85,
      measuredValue: features.avgKneeAngle,
      targetValue: angles.targetDepthKnee,
      messageEn: "Sit deeper — aim for thighs closer to parallel.",
      messageHi: "Thoda aur neeche baithein — thighs parallel karein.",
    });
  }

  // Rule 4: Excessive Descent Speed
  if (phase === "DESCENDING" && Math.abs(features.kneeVelocity) > angles.maxSpeedDegPerSec) {
    errors.push({
      ruleId: "EXCESSIVE_SPEED",
      bodyPart: "full_body",
      errorType: "fast_speed",
      severity: "MODERATE",
      confidence: 0.8,
      measuredValue: Math.abs(features.kneeVelocity),
      targetValue: angles.maxSpeedDegPerSec,
      messageEn: "Slow down your movement — descend with control.",
      messageHi: "Dheere aur niyantran ke saath neeche aayein.",
    });
  }

  // Rule 5: Asymmetry
  if (features.asymmetryDelta > angles.maxAsymmetry && phase !== "STANDING") {
    errors.push({
      ruleId: "ASYMMETRY",
      bodyPart: "hips",
      errorType: "asymmetry",
      severity: "MINOR",
      confidence: 0.75,
      measuredValue: features.asymmetryDelta,
      targetValue: angles.maxAsymmetry,
      messageEn: "Try to keep both sides even as you move.",
      messageHi: "Dono taraf aamne-saamne barabar vajan rakhein.",
    });
  }

  return errors;
}

/** State tracking for temporal error persistence & clearance. */
export class TemporalFormAnalyzer {
  private activeErrorsMap = new Map<string, { error: FormError; firstDetectedAt: number }>();
  private clearCandidateMap = new Map<string, number>();

  update(rawErrors: FormError[], config: SquatConfig): FormError[] {
    const now = Date.now();
    const rawRuleIds = new Set(rawErrors.map((e) => e.ruleId));

    // 1. Process candidate raw errors for activation persistence
    for (const err of rawErrors) {
      if (!this.activeErrorsMap.has(err.ruleId)) {
        // Not active yet — record first detection timestamp
        this.activeErrorsMap.set(err.ruleId, { error: err, firstDetectedAt: now });
      } else {
        // Update error payload while preserving original detection timestamp
        const current = this.activeErrorsMap.get(err.ruleId)!;
        this.activeErrorsMap.set(err.ruleId, { error: err, firstDetectedAt: current.firstDetectedAt });
      }
      this.clearCandidateMap.delete(err.ruleId);
    }

    // 2. Process active errors that are no longer detected (clearance persistence)
    for (const ruleId of Array.from(this.activeErrorsMap.keys())) {
      if (!rawRuleIds.has(ruleId)) {
        if (!this.clearCandidateMap.has(ruleId)) {
          this.clearCandidateMap.set(ruleId, now);
        } else {
          const clearDuration = now - this.clearCandidateMap.get(ruleId)!;
          if (clearDuration >= config.persistence.correctionClearMs) {
            this.activeErrorsMap.delete(ruleId);
            this.clearCandidateMap.delete(ruleId);
          }
        }
      }
    }

    // 3. Filter only errors that have satisfied the activation persistence window
    const confirmedErrors: FormError[] = [];
    for (const [_, item] of this.activeErrorsMap.entries()) {
      const activeDuration = now - item.firstDetectedAt;
      if (activeDuration >= config.persistence.errorActivationMs) {
        confirmedErrors.push(item.error);
      }
    }

    return confirmedErrors;
  }

  reset() {
    this.activeErrorsMap.clear();
    this.clearCandidateMap.clear();
  }
}
