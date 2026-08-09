/**
 * Config-driven Rule Engine.
 * Evaluates MediaPipe landmarks against an ExerciseConfig without hardcoded per-exercise branches.
 */

import type { Landmark } from "./angleUtils";
import { visible } from "./angleUtils";
import type { ExerciseConfig, ExerciseFormResult } from "./config";
import type { FormStatus } from "@/lib/types";

export interface EvaluatedRule {
  id: string;
  label: string;
  label_hi?: string;
  angle: number;
  min: number;
  max: number;
  passed: boolean;
  errorKey: string;
}

export interface DetailedFormEvaluation extends ExerciseFormResult {
  ruleResults: EvaluatedRule[];
}

export function evaluateFrameWithConfig(
  lms: Landmark[],
  config: ExerciseConfig
): DetailedFormEvaluation {
  const isVisible = visible(lms, config.requiredLandmarks);
  if (!isVisible) {
    return {
      visible: false,
      score: 50,
      formStatus: "warning",
      issues: ["not_visible"],
      angles: {},
      ruleResults: [],
    };
  }

  // Delegate to config's custom evaluator if needed, while enriching with rule details
  const baseResult = config.evaluateForm(lms);

  const ruleResults: EvaluatedRule[] = config.jointRules.map((rule) => {
    const angle = rule.getAngle(lms);
    const passed =
      angle >= rule.target.min - rule.target.tolerance &&
      angle <= rule.target.max + rule.target.tolerance;

    const res: EvaluatedRule = {
      id: rule.id,
      label: rule.label,
      angle: Math.round(angle),
      min: rule.target.min,
      max: rule.target.max,
      passed,
      errorKey: rule.errorKey,
    };
    if (rule.label_hi !== undefined) {
      res.label_hi = rule.label_hi;
    }
    return res;
  });

  return {
    ...baseResult,
    ruleResults,
  };
}
