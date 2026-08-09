/**
 * Unified Squat Engine — Single Authoritative Source of Truth.
 * Orchestrates quality evaluation, temporal smoothing, 3D biomechanics,
 * phase detection with hysteresis, temporal rule analysis, rep counting, and canvas overlay rendering.
 */

import type { Landmark } from "@/lib/exercises/angleUtils";
import {
  evalLandmarkQuality,
  rejectLandmarkOutliers,
  LandmarkSmoother,
  POSE_CONNECTIONS,
  LM,
  at,
} from "@/lib/exercises/angleUtils";
import type { FormStatus } from "@/lib/types";
import { DEFAULT_SQUAT_CONFIG, type SquatConfig } from "./config";
import { SquatPhaseDetector, type SquatPhase } from "./phaseDetector";
import {
  extractSquatFeatures,
  evaluateSquatRules,
  TemporalFormAnalyzer,
  type BiomechanicalFeatures,
  type FormError,
} from "./squatRules";
import { SquatRepCounter, type RepSummary } from "./repCounter";
import { FeedbackManager, type UnifiedFeedbackState } from "@/lib/feedback/feedbackManager";
import type { VoiceService } from "@/lib/exercises/voiceService";

export type SystemState =
  | "NO_PERSON"
  | "CAMERA_NOT_READY"
  | "CALIBRATING"
  | "INSUFFICIENT_VISIBILITY"
  | "READY"
  | "TRACKING";

export interface SquatEngineFrameResult {
  systemState: SystemState;
  movementPhase: SquatPhase;
  formStatus: FormStatus;
  landmarksVisible: boolean;
  poseConfidence: number;
  features: BiomechanicalFeatures;
  activeErrors: FormError[];
  feedback: UnifiedFeedbackState;
  repCount: number;
  validReps: number;
  invalidReps: number;
  latestRep: RepSummary | null;
  overallScore: number;
  topCorrections: string[];
}

export class SquatEngine {
  private config: SquatConfig;
  private smoother = new LandmarkSmoother(0.4);
  private phaseDetector: SquatPhaseDetector;
  private temporalAnalyzer = new TemporalFormAnalyzer();
  private repCounter: SquatRepCounter;
  private feedbackManager = new FeedbackManager(4000);

  private prevLandmarks: Landmark[] | null = null;
  private prevKneeAngle: number | null = null;
  private lastTimestamp: number = performance.now();

  constructor(config = DEFAULT_SQUAT_CONFIG) {
    this.config = config;
    this.phaseDetector = new SquatPhaseDetector(config);
    this.repCounter = new SquatRepCounter(config);
  }

  processFrame(
    rawLandmarks: Landmark[],
    voiceService?: VoiceService,
    language: "en" | "hi" = "en"
  ): SquatEngineFrameResult {
    const now = performance.now();
    const deltaTimeSec = Math.max(0.01, (now - this.lastTimestamp) / 1000);
    this.lastTimestamp = now;

    // 1. Landmark Quality Check
    const qualityResult = evalLandmarkQuality(
      rawLandmarks,
      this.config.camera.requiredLandmarks,
      this.config.camera.goodVisibility,
      this.config.camera.minVisibility
    );

    if (qualityResult.quality === "UNRELIABLE") {
      const feedback = this.feedbackManager.processFeedback([], false, voiceService, language);
      const emptyFeatures = extractSquatFeatures([], null, 0);

      return {
        systemState: rawLandmarks.length ? "INSUFFICIENT_VISIBILITY" : "NO_PERSON",
        movementPhase: this.phaseDetector.getPhase(),
        formStatus: "warning",
        landmarksVisible: false,
        poseConfidence: Math.round(qualityResult.avgVisibility * 100),
        features: emptyFeatures,
        activeErrors: [],
        feedback,
        repCount: this.repCounter.validReps + this.repCounter.invalidReps,
        validReps: this.repCounter.validReps,
        invalidReps: this.repCounter.invalidReps,
        latestRep: null,
        overallScore: this.repCounter.getOverallScore(),
        topCorrections: this.repCounter.getTopCorrections(),
      };
    }

    // 2. Outlier Rejection & Temporal Smoothing
    const filteredLms = rejectLandmarkOutliers(rawLandmarks, this.prevLandmarks, 0.25);
    const smoothedLms = this.smoother.filter(filteredLms);
    this.prevLandmarks = smoothedLms;

    // 3. Biomechanical Feature Extraction
    const features = extractSquatFeatures(smoothedLms, this.prevKneeAngle, deltaTimeSec);
    this.prevKneeAngle = features.avgKneeAngle;

    // 4. Movement Phase Detection with Hysteresis
    const phaseResult = this.phaseDetector.update(features.avgKneeAngle, features.kneeVelocity);

    // 5. Raw Form Rules & Temporal Error Persistence
    const rawErrors = evaluateSquatRules(features, phaseResult.phase, this.config);
    const activeErrors = this.temporalAnalyzer.update(rawErrors, this.config);

    // 6. Unified Feedback Manager (Text + Voice + Body Highlight Metadata)
    const feedback = this.feedbackManager.processFeedback(activeErrors, true, voiceService, language);

    // 7. Stateful Rep Counter & Accumulator Rep Quality Scoring
    const repResult = this.repCounter.updateFrame(
      phaseResult.phase,
      features,
      activeErrors,
      phaseResult.minKneeAngleInRep,
      phaseResult.maxKneeAngleInRep,
      phaseResult.phaseChanged
    );

    const systemState: SystemState =
      phaseResult.phase === "STANDING" ? "READY" : "TRACKING";

    return {
      systemState,
      movementPhase: phaseResult.phase,
      formStatus: feedback.formStatus,
      landmarksVisible: true,
      poseConfidence: Math.round(qualityResult.avgVisibility * 100),
      features,
      activeErrors,
      feedback,
      repCount: this.repCounter.validReps + this.repCounter.invalidReps,
      validReps: this.repCounter.validReps,
      invalidReps: this.repCounter.invalidReps,
      latestRep: repResult.rep,
      overallScore: this.repCounter.getOverallScore(),
      topCorrections: this.repCounter.getTopCorrections(),
    };
  }

  /** Render skeleton overlay on HTML5 Canvas with Body-Part Highlighting. */
  drawOverlay(
    canvas: HTMLCanvasElement | null,
    video: HTMLVideoElement,
    lms: Landmark[],
    feedback: UnifiedFeedbackState
  ) {
    if (!canvas) return;
    const w = video.videoWidth || canvas.width;
    const h = video.videoHeight || canvas.height;

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    if (!lms.length) return;

    const baseColor =
      feedback.formStatus === "good"
        ? "#10b981"
        : feedback.formStatus === "warning"
        ? "#f59e0b"
        : "#ef4444";

    ctx.lineWidth = Math.max(3, w / 260);
    ctx.shadowColor = baseColor;
    ctx.shadowBlur = 8;

    // Determine highlighted body part indices
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

    // 1. Draw Skeleton Edges
    for (const [a, b] of POSE_CONNECTIONS) {
      const p1 = lms[a];
      const p2 = lms[b];
      if (!p1 || !p2 || (p1.visibility ?? 1) < 0.3 || (p2.visibility ?? 1) < 0.3) continue;

      const isHighlightedEdge = highlightIndices.has(a) || highlightIndices.has(b);
      ctx.strokeStyle = isHighlightedEdge ? "#ef4444" : baseColor;
      ctx.beginPath();
      ctx.moveTo(p1.x * w, p1.y * h);
      ctx.lineTo(p2.x * w, p2.y * h);
      ctx.stroke();
    }

    // 2. Draw Landmark Dots
    const defaultRadius = Math.max(4, w / 200);
    for (let i = 0; i < lms.length; i++) {
      const lm = lms[i];
      if (!lm || (lm.visibility ?? 1) < 0.3) continue;

      const isHighlightedDot = highlightIndices.has(i);
      ctx.fillStyle = isHighlightedDot ? "#ef4444" : baseColor;
      const r = isHighlightedDot ? defaultRadius * 1.8 : defaultRadius;

      ctx.beginPath();
      ctx.arc(lm.x * w, lm.y * h, r, 0, Math.PI * 2);
      ctx.fill();

      // Pulsing ring around highlighted joints
      if (isHighlightedDot) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(lm.x * w, lm.y * h, r + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.shadowBlur = 0;
  }

  reset() {
    this.smoother.reset();
    this.phaseDetector.reset();
    this.temporalAnalyzer.reset();
    this.repCounter.reset();
    this.feedbackManager.reset();
    this.prevLandmarks = null;
    this.prevKneeAngle = null;
  }
}
