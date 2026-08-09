import { useCallback, useEffect, useRef, useState } from "react";
import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import type { Landmark } from "@/lib/exercises/angleUtils";
import { SquatEngine, type SquatEngineFrameResult } from "@/lib/pose/squat/engine";
import type { FormStatus, PoseFrameResult } from "@/lib/types";

const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MODEL_URL = "/mediapipe/models/pose_landmarker_lite.task";

export interface PoseSessionState extends PoseFrameResult {
  validReps: number;
  invalidReps: number;
  corrections: string[];
  running: boolean;
  ready: boolean;
  error: string | null;
  elapsedSeconds: number;
  debugResult: SquatEngineFrameResult | null;
}

const INITIAL: PoseSessionState = {
  repCount: 0,
  accuracy: 100,
  formStatus: "warning",
  feedbackText: "Stand back so your whole body is visible, then start squatting.",
  validReps: 0,
  invalidReps: 0,
  corrections: [],
  running: false,
  ready: false,
  error: null,
  elapsedSeconds: 0,
  debugResult: null,
};

/**
 * Client-side pose session hook delegating to the single authoritative SquatEngine.
 */
export function usePoseSession(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  _exercise: string
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const squatEngineRef = useRef(new SquatEngine());
  const startedAtRef = useRef(0);
  const runningRef = useRef(false);

  const [state, setState] = useState<PoseSessionState>(INITIAL);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setState((s) => ({ ...s, running: false }));
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(async () => {
    if (runningRef.current) return;
    setState({ ...INITIAL, feedbackText: "Loading the on-device pose model…" });
    squatEngineRef.current.reset();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("Camera element not ready");
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
        feedbackText: "Camera live. Take your first rep when you're ready.",
      }));
      loop();
    } catch (err) {
      stop();
      setState((s) => ({
        ...s,
        error:
          err instanceof Error
            ? err.message
            : "Could not access the camera. Check browser permissions.",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef, stop]);

  const loop = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!runningRef.current || !video || !landmarker) return;

    if (streamRef.current && video.srcObject !== streamRef.current) {
      video.srcObject = streamRef.current;
      video.play().catch(() => {});
    }

    if (video.readyState >= 2) {
      const result = landmarker.detectForVideo(video, performance.now());
      const lms = (result.landmarks?.[0] ?? []) as Landmark[];

      const engineRes = squatEngineRef.current.processFrame(lms);
      squatEngineRef.current.drawOverlay(canvasRef.current, video, lms, engineRes.feedback);

      setState((s) => ({
        ...s,
        repCount: engineRes.repCount,
        validReps: engineRes.validReps,
        invalidReps: engineRes.invalidReps,
        accuracy: engineRes.overallScore,
        formStatus: engineRes.formStatus,
        feedbackText: engineRes.feedback.textEn,
        corrections: engineRes.topCorrections,
        elapsedSeconds: Math.round((Date.now() - startedAtRef.current) / 1000),
        debugResult: engineRes,
      }));
    }

    rafRef.current = requestAnimationFrame(loop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef]);

  return { ...state, start, stop, canvasRef };
}
