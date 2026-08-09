import { useCallback, useEffect, useRef, useState } from "react";
import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import type { Landmark } from "@/lib/exercises/angleUtils";
import { getExerciseConfig, type ExerciseConfig } from "@/lib/exercises/config";
import { VoiceService, type AudioSettings } from "@/lib/exercises/voiceService";
import type { FormStatus } from "@/lib/types";
import type { EvaluatedRule } from "@/lib/exercises/ruleEngine";
import { ExerciseEngine, type ExerciseEngineFrameResult } from "@/lib/pose/exerciseEngine";

const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MODEL_URL = "/mediapipe/models/pose_landmarker_lite.task";

export interface ExerciseEngineState {
  exerciseConfig: ExerciseConfig | null;
  running: boolean;
  ready: boolean;
  error: string | null;
  landmarksVisible: boolean;
  formStatus: FormStatus;
  formScore: number;
  feedbackText: string;
  evaluatedRules: EvaluatedRule[];
  angles: Record<string, number | string>;
  repCount: number;
  validReps: number;
  invalidReps: number;
  holdSecondsLeft: number;
  progressPercent: number;
  topCorrections: string[];
  elapsedSeconds: number;
  debugResult: ExerciseEngineFrameResult | null;
  fps: number;
}

const INITIAL_STATE: ExerciseEngineState = {
  exerciseConfig: null,
  running: false,
  ready: false,
  error: null,
  landmarksVisible: false,
  formStatus: "warning",
  formScore: 100,
  feedbackText: "Position yourself in full view of the camera.",
  evaluatedRules: [],
  angles: {},
  repCount: 0,
  validReps: 0,
  invalidReps: 0,
  holdSecondsLeft: 0,
  progressPercent: 0,
  topCorrections: [],
  elapsedSeconds: 0,
  debugResult: null,
  fps: 0,
};

export function useExerciseEngine(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  exerciseId: string,
  initialAudioSettings?: Partial<AudioSettings>
) {
  // ── All mutable refs ──────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const startedAtRef = useRef(0);
  const exerciseIdRef = useRef(exerciseId);

  // Unified exercise engine instance
  const exerciseEngineRef = useRef(new ExerciseEngine());
  const configRef = useRef(getExerciseConfig(exerciseId) ?? getExerciseConfig("squat")!);
  const voiceRef = useRef(new VoiceService(initialAudioSettings));

  // FPS calculation refs
  const frameCountRef = useRef(0);
  const lastFpsCalcRef = useRef(performance.now());
  const currentFpsRef = useRef(0);

  // React state (drives renders)
  const [state, setState] = useState<ExerciseEngineState>(() => ({
    ...INITIAL_STATE,
    exerciseConfig: configRef.current,
  }));

  useEffect(() => {
    const newConfig = getExerciseConfig(exerciseId) ?? getExerciseConfig("squat")!;
    configRef.current = newConfig;
    exerciseIdRef.current = exerciseId;
    exerciseEngineRef.current.reset();
    setState((s) => ({
      ...s,
      exerciseConfig: newConfig,
      validReps: 0,
      invalidReps: 0,
      repCount: 0,
      elapsedSeconds: 0,
      formScore: 100,
    }));
  }, [exerciseId]);

  const updateAudioSettings = useCallback((newSettings: Partial<AudioSettings>) => {
    voiceRef.current.updateSettings(newSettings);
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    voiceRef.current.stop();
    setState((s) => ({ ...s, running: false }));
  }, []);

  useEffect(() => () => stop(), [stop]);

  // ── Animation loop reading the shared exercise engine ───────────────────
  const loop = useCallback(() => {
    if (!runningRef.current) return;
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !landmarker) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    // Auto-rebind stream if video element changed or remounted
    if (streamRef.current && video.srcObject !== streamRef.current) {
      video.srcObject = streamRef.current;
      video.play().catch(() => {});
    }

    if (video.readyState >= 2) {
      const now = performance.now();
      frameCountRef.current += 1;
      if (now - lastFpsCalcRef.current >= 1000) {
        currentFpsRef.current = Math.round((frameCountRef.current * 1000) / (now - lastFpsCalcRef.current));
        frameCountRef.current = 0;
        lastFpsCalcRef.current = now;
      }

      const result = landmarker.detectForVideo(video, now);
      const lms = (result.landmarks?.[0] ?? []) as Landmark[];

      const lang = voiceRef.current.getSettings().language;
      const engineRes = exerciseEngineRef.current.processFrame(
        lms,
        voiceRef.current,
        lang,
        configRef.current
      );

      // Draw skeleton & joint highlights on overlay canvas
      exerciseEngineRef.current.drawOverlay(canvasRef.current, video, lms, engineRes.feedback);

      const isHi = lang === "hi";
      const feedbackText = isHi ? engineRes.feedback.textHi : engineRes.feedback.textEn;

      const anglesMap: Record<string, number | string> = {
        ...engineRes.angles,
      };

      const evaluatedRules = engineRes.activeErrors.map((err) => ({
        id: err.ruleId,
        label: err.bodyPart.toUpperCase(),
        angle: Math.round(err.measuredValue),
        min: 0,
        max: Math.round(err.targetValue),
        passed: false,
        errorKey: err.errorType,
      }));

      const progressPercent = Math.min(
        100,
        Math.round((engineRes.validReps / configRef.current.targetReps) * 100)
      );

      setState((s) => ({
        ...s,
        landmarksVisible: engineRes.landmarksVisible,
        formStatus: engineRes.formStatus,
        formScore: engineRes.overallScore,
        feedbackText,
        evaluatedRules,
        angles: anglesMap,
        repCount: engineRes.repCount,
        validReps: engineRes.validReps,
        invalidReps: engineRes.invalidReps,
        progressPercent,
        topCorrections: engineRes.topCorrections,
        elapsedSeconds: Math.round((Date.now() - startedAtRef.current) / 1000),
        debugResult: engineRes,
        fps: currentFpsRef.current,
      }));
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [videoRef]);

  // ── Start camera & AI loop ────────────────────────────────────────────────
  const start = useCallback(async () => {
    if (runningRef.current) return;

    exerciseEngineRef.current.reset();
    setState((s) => ({
      ...s,
      running: true,
      ready: false,
      error: null,
      validReps: 0,
      invalidReps: 0,
      repCount: 0,
      elapsedSeconds: 0,
      formScore: 100,
      feedbackText: "Loading on-device pose model…",
    }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("Camera element not found");
      video.srcObject = stream;
      await video.play();

      if (!landmarkerRef.current) {
        const vision = await import("@mediapipe/tasks-vision");
        const fileset = await vision.FilesetResolver.forVisionTasks(WASM_BASE);
        landmarkerRef.current = await vision.PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          runningMode: "VIDEO",
          numPoses: 1,
        });
      }

      runningRef.current = true;
      startedAtRef.current = Date.now();
      setState((s) => ({
        ...s,
        running: true,
        ready: true,
        feedbackText: "Camera live. Take your first squat when ready.",
      }));

      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      stop();
      setState((s) => ({
        ...s,
        error:
          err instanceof Error
            ? err.message
            : "Could not access camera. Please allow camera permissions.",
      }));
    }
  }, [loop, stop, videoRef]);

  return {
    ...state,
    start,
    stop,
    canvasRef,
    updateAudioSettings,
    audioSettings: voiceRef.current.getSettings(),
  };
}
