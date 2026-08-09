import type { Landmark } from "@/lib/exercises/angleUtils";
import {
  evalLandmarkQuality,
  rejectLandmarkOutliers,
  LandmarkSmoother,
  normalizeBodyCoordinates,
  type LandmarkQualityResult,
} from "@/lib/exercises/angleUtils";
import type { ExerciseConfig } from "@/lib/exercises/config";
import { evaluateFrameWithConfig, type DetailedFormEvaluation } from "@/lib/exercises/ruleEngine";
import { ExerciseRepCounter } from "@/lib/exercises/repCounter";
import { FeedbackManager, type UnifiedFeedbackState } from "@/lib/feedback/feedbackManager";
import type { VoiceService } from "@/lib/exercises/voiceService";
import type { FormStatus } from "@/lib/types";
import type { FormError } from "@/lib/pose/squat/squatRules";
import { LM, POSE_CONNECTIONS, at } from "@/lib/exercises/angleUtils";

export type ExerciseSystemState =
  | "NO_PERSON"
  | "CAMERA_NOT_READY"
  | "CALIBRATING"
  | "INSUFFICIENT_VISIBILITY"
  | "READY"
  | "TRACKING";

export interface ExerciseEngineFrameResult {
  systemState: ExerciseSystemState;
  formStatus: FormStatus;
  landmarksVisible: boolean;
  poseConfidence: number;
  activeErrors: FormError[];
  feedback: UnifiedFeedbackState;
  repCount: number;
  validReps: number;
  invalidReps: number;
  holdSecondsLeft: number;
  overallScore: number;
  topCorrections: string[];
  evaluation: DetailedFormEvaluation;
  angles: Record<string, number | string>;
  quality: LandmarkQualityResult;
}

export class ExerciseEngine {
  private smoother = new LandmarkSmoother(0.4);
  private feedbackManager = new FeedbackManager(4000);
  private repCounter: ExerciseRepCounter | null = null;
  private prevLandmarks: Landmark[] | null = null;
  private lastTimestamp = performance.now();

  processFrame(
    rawLandmarks: Landmark[],
    voiceService?: VoiceService,
    language: "en" | "hi" = "hi",
    config?: ExerciseConfig
  ): ExerciseEngineFrameResult {
    const now = performance.now();
    const deltaTimeSec = Math.max(0.01, (now - this.lastTimestamp) / 1000);
    this.lastTimestamp = now;

    if (!config) {
      const fallback = this.feedbackManager.processFeedback([], false, voiceService, language);
      return {
        systemState: "CAMERA_NOT_READY",
        formStatus: "warning",
        landmarksVisible: false,
        poseConfidence: 0,
        activeErrors: [],
        feedback: fallback,
        repCount: 0,
        validReps: 0,
        invalidReps: 0,
        holdSecondsLeft: 0,
        overallScore: 0,
        topCorrections: [],
        evaluation: {
          visible: false,
          score: 0,
          formStatus: "warning",
          issues: [],
          angles: {},
          ruleResults: [],
        },
        angles: {},
        quality: { quality: "UNRELIABLE", avgVisibility: 0, missingIndices: [] },
      };
    }

    this.repCounter = this.repCounter ?? new ExerciseRepCounter(config);

    const qualityResult = evalLandmarkQuality(rawLandmarks, config.requiredLandmarks, 0.7, 0.45);
    if (qualityResult.quality === "UNRELIABLE") {
      const feedback = this.feedbackManager.processFeedback([], false, voiceService, language);
      return {
        systemState: rawLandmarks.length ? "INSUFFICIENT_VISIBILITY" : "NO_PERSON",
        formStatus: "warning",
        landmarksVisible: false,
        poseConfidence: Math.round(qualityResult.avgVisibility * 100),
        activeErrors: [],
        feedback,
        repCount: this.repCounter.validReps + this.repCounter.invalidReps,
        validReps: this.repCounter.validReps,
        invalidReps: this.repCounter.invalidReps,
        holdSecondsLeft: this.repCounter.getHoldSecondsLeft(),
        overallScore: this.repCounter.getProgress(rawLandmarks),
        topCorrections: this.repCounter.getTopCorrections(),
        evaluation: {
          visible: false,
          score: 50,
          formStatus: "warning",
          issues: [],
          angles: {},
          ruleResults: [],
        },
        angles: {},
        quality: qualityResult,
      };
    }

    const filteredLms = rejectLandmarkOutliers(rawLandmarks, this.prevLandmarks, 0.25);
    const smoothedLms = this.smoother.filter(filteredLms);
    this.prevLandmarks = smoothedLms;

    const normalizedLms = normalizeBodyCoordinates(smoothedLms);
    const evaluation = evaluateFrameWithConfig(normalizedLms, config);
    const activeErrors = evaluation.issues.map((issue) => this.toFormError(issue, config, evaluation));

    const feedback = this.feedbackManager.processFeedback(activeErrors, true, voiceService, language);
    const repResult = this.repCounter.update(
      normalizedLms,
      feedback.formStatus,
      evaluation.issues
    );

    const angles: Record<string, number | string> = {};
    Object.entries(evaluation.angles).forEach(([label, value]) => {
      angles[label] = typeof value === "number" ? Math.round(value) : value;
    });

    const baseScore = Math.max(0, Math.min(100, evaluation.score));

    return {
      systemState: feedback.formStatus === "good" ? "READY" : "TRACKING",
      formStatus: feedback.formStatus,
      landmarksVisible: true,
      poseConfidence: Math.round(qualityResult.avgVisibility * 100),
      activeErrors,
      feedback,
      repCount: this.repCounter.validReps + this.repCounter.invalidReps,
      validReps: this.repCounter.validReps,
      invalidReps: this.repCounter.invalidReps,
      holdSecondsLeft: this.repCounter.getHoldSecondsLeft(),
      overallScore: baseScore,
      topCorrections: this.repCounter.getTopCorrections(),
      evaluation,
      angles,
      quality: qualityResult,
    };
  }

  drawOverlay(
    canvas: HTMLCanvasElement | null,
    video: HTMLVideoElement,
    lms: Landmark[],
    feedback: UnifiedFeedbackState
  ) {
    if (!canvas) return;
    const width = video.videoWidth || canvas.width;
    const height = video.videoHeight || canvas.height;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    if (!lms.length) return;

    const baseColor = feedback.formStatus === "good" ? "#10b981" : feedback.formStatus === "warning" ? "#f59e0b" : "#ef4444";

    ctx.lineWidth = Math.max(3, width / 260);
    ctx.shadowColor = baseColor;
    ctx.shadowBlur = 8;

    const highlightIndices = new Set<number>();
    for (const part of feedback.affectedBodyParts) {
      if (part === "left_knee") highlightIndices.add(LM.LEFT_KNEE);
      else if (part === "right_knee") highlightIndices.add(LM.RIGHT_KNEE);
      else if (part === "both_knees") {
        highlightIndices.add(LM.LEFT_KNEE);
        highlightIndices.add(LM.RIGHT_KNEE);
      } else if (part === "torso") {
        highlightIndices.add(LM.LEFT_SHOULDER);
        highlightIndices.add(LM.RIGHT_SHOULDER);
        highlightIndices.add(LM.LEFT_HIP);
        highlightIndices.add(LM.RIGHT_HIP);
      }
    }

    for (const [a, b] of POSE_CONNECTIONS) {
      const p1 = lms[a];
      const p2 = lms[b];
      if (!p1 || !p2 || (p1.visibility ?? 1) < 0.3 || (p2.visibility ?? 1) < 0.3) continue;
      const isHighlightedEdge = highlightIndices.has(a) || highlightIndices.has(b);
      ctx.strokeStyle = isHighlightedEdge ? "#ef4444" : baseColor;
      ctx.beginPath();
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.stroke();
    }

    const defaultRadius = Math.max(4, width / 200);
    for (let i = 0; i < lms.length; i++) {
      const lm = lms[i];
      if (!lm || (lm.visibility ?? 1) < 0.3) continue;
      const isHighlightedDot = highlightIndices.has(i);
      ctx.fillStyle = isHighlightedDot ? "#ef4444" : baseColor;
      const r = isHighlightedDot ? defaultRadius * 1.8 : defaultRadius;
      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, r, 0, Math.PI * 2);
      ctx.fill();
      if (isHighlightedDot) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(lm.x * width, lm.y * height, r + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.shadowBlur = 0;
  }

  reset() {
    this.smoother.reset();
    this.feedbackManager.reset();
    this.prevLandmarks = null;
    this.repCounter = null;
    this.lastTimestamp = performance.now();
  }

  private toFormError(issue: string, config: ExerciseConfig, evaluation: DetailedFormEvaluation): FormError {
    const correction = config.corrections[issue];
    const fallbackHi = "कृपया धीरे-धीरे करें।";
    const fallbackEn = "Please move with care and control.";
    const bodyPart = this.bodyPartForIssue(issue);

    return {
      ruleId: issue,
      bodyPart,
      errorType: issue,
      severity: evaluation.score < 60 ? "CRITICAL" : "MAJOR",
      confidence: 0.85,
      measuredValue: 100 - evaluation.score,
      targetValue: 80,
      messageEn: correction?.en ?? fallbackEn,
      messageHi: correction?.hi ?? fallbackHi,
    };
  }

  private bodyPartForIssue(issue: string): FormError["bodyPart"] {
    if (issue.includes("knee")) return "left_knee";
    if (issue.includes("torso") || issue.includes("lean")) return "torso";
    if (issue.includes("hip") || issue.includes("pelvis")) return "hips";
    if (issue.includes("visible")) return "full_body";
    return "full_body";
  }
}
