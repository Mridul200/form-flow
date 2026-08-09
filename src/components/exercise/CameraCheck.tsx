import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  CheckCircle2,
  Play,
  Video,
  XCircle,
  AlertTriangle,
  Timer,
  Hash,
  XCircleIcon,
  RefreshCw,
} from "lucide-react";
import { getExerciseCameraNote, type ExerciseConfig } from "@/lib/exercises/config";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";

interface CameraCheckProps {
  exercise: ExerciseConfig;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  running: boolean;
  ready: boolean;
  landmarksVisible: boolean;
  error: string | null;
  onStartCamera: () => void;
  onConfirmStartExercise: () => void;
  // Live stats passed in from engine (shown as preview while camera is live)
  validReps?: number;
  elapsedSeconds?: number;
}

export function CameraCheck({
  exercise,
  videoRef,
  canvasRef,
  running,
  ready,
  landmarksVisible,
  error,
  onStartCamera,
  onConfirmStartExercise,
  validReps = 0,
  elapsedSeconds = 0,
}: CameraCheckProps) {
  const { language, t } = useLanguage();
  const bodyDetected = running && ready;
  const positionGood = bodyDetected && landmarksVisible;
  const cameraNote = getExerciseCameraNote(exercise, language);
  const isHi = language === "hi";

  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
  }, []);

  // Auto-start: When positionGood transitions to true start a 3-second countdown
  useEffect(() => {
    if (!positionGood) {
      // Position lost — cancel any in-progress countdown
      clearCountdown();
      return;
    }

    // Already counting down, don't restart
    if (countdownRef.current) return;

    // Start 5-second countdown to give user time to step back
    setCountdown(5);
    let current = 5;
    countdownRef.current = setInterval(() => {
      current -= 1;
      if (current <= 0) {
        clearInterval(countdownRef.current!);
        countdownRef.current = null;
        setCountdown(0);
        onConfirmStartExercise();
      } else {
        setCountdown(current);
      }
    }, 1000);

    return () => clearCountdown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionGood]);

  // Format elapsed time as MM:SS
  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  return (
    <div className="surface-card overflow-hidden p-6 max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-1.5">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {isHi ? "कैमरा ठीक से रखें" : "Get your camera ready"}
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {cameraNote} {isHi ? "जब सब ठीक हो जाए, तो अभ्यास अपने आप शुरू हो जाएगा।" : "When everything looks right, the exercise will start automatically."}
        </p>
      </div>

      {/* Live Camera Viewport */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-foreground/90 shadow-inner">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 size-full scale-x-[-1] object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 size-full scale-x-[-1] object-cover"
        />

        {/* Camera not started overlay */}
        {!running && (
          <div className="absolute inset-0 grid place-items-center bg-foreground/75 p-6 text-center backdrop-blur-sm z-10">
            <div>
              <Video className="mx-auto size-10 text-primary-foreground mb-3" />
              <p className="max-w-xs text-xs text-primary-foreground/90 mb-4">
                {error ?? (isHi
                  ? "व्यायाम देखने के लिए कैमरा चाहिए।"
                  : "We need camera access to guide your movement.")}
              </p>
              <Button
                id="start-camera-btn"
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={onStartCamera}
              >
                <Play className="size-4" />
                {isHi ? "कैमरा खोलें" : "Open camera"}
              </Button>
            </div>
          </div>
        )}

        {/* Live rep count + timer badge (top-left) while camera is running */}
        {running && (
          <div className="absolute left-3 top-3 flex flex-col gap-2 z-20">
            <div className="flex items-center gap-1.5 rounded-xl bg-black/70 px-3 py-1.5 text-white backdrop-blur-sm shadow-md">
              <Hash className="size-3.5 text-emerald-400" />
              <span className="text-xs font-bold tabular-nums text-emerald-400">
                {String(validReps).padStart(2, "0")}
              </span>
              <span className="text-[10px] text-slate-300 font-medium">
                {isHi ? "रेप्स" : "Reps"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-black/70 px-3 py-1.5 text-white backdrop-blur-sm shadow-md">
              <Timer className="size-3.5 text-sky-400" />
              <span className="text-xs font-bold tabular-nums text-sky-400">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
          </div>
        )}

        {/* Auto-start countdown overlay (center of video) */}
        {positionGood && countdown !== null && countdown > 0 && (
          <div className="absolute inset-0 grid place-items-center z-20 bg-black/30 backdrop-blur-[1px]">
            <div className="text-center space-y-2">
              <div className="text-[72px] font-extrabold text-white drop-shadow-2xl leading-none animate-pulse">
                {countdown}
              </div>
              <p className="text-sm font-bold text-emerald-300 tracking-wide">
                {isHi ? "व्यायाम शुरू हो रहा है…" : "Exercise starting…"}
              </p>
            </div>
          </div>
        )}

        {/* Top-right: Position banner */}
        {running && !positionGood && (
          <div className="absolute inset-x-3 top-3 rounded-xl bg-amber-500/90 text-white p-2.5 text-center text-xs font-bold backdrop-blur-sm shadow-md z-20 flex items-center justify-center gap-2">
            <AlertTriangle className="size-4" />
            {isHi ? "पूरा शरीर कैमरे में आए" : "Move so your whole body is seen"}
          </div>
        )}
      </div>

      {/* Positioning Status Checklist */}
      <div className="rounded-xl bg-accent/40 p-4 border border-border/40 space-y-2 text-xs font-medium">
        <CheckRow
          label={isHi ? "कैमरा चालू है" : "Camera is on"}
          passed={bodyDetected}
          passText={isHi ? "सक्रिय" : "Active"}
          failText={isHi ? "प्रतीक्षा कर रहा है" : "Waiting"}
        />
        <CheckRow
          label={isHi ? "शरीर दिख रहा है" : "Body is visible"}
          passed={landmarksVisible}
          passText={isHi ? "दिख रहा है" : "Visible"}
          failText={isHi ? "फ्रेम में आएं" : "Move into frame"}
          isWarning
        />
        <CheckRow
          label={isHi ? "दूरी और स्थिति" : "Distance and position"}
          passed={positionGood}
          passText={isHi ? "अच्छा है" : "Good"}
          failText={isHi ? "समायोजन हो रहा है" : "Adjusting"}
        />
      </div>

      {/* Bottom CTA — disabled until positionGood, shows countdown progress */}
      {running ? (
        <Button
          id="confirm-start-exercise-btn"
          size="lg"
          className="w-full text-base font-bold gap-2 shadow-lg transition-all"
          disabled={!positionGood}
          onClick={onConfirmStartExercise}
        >
          <Play className="size-5" />
          {positionGood
            ? countdown !== null && countdown > 0
              ? isHi
                ? `${countdown} सेकंड में शुरू हो रहा है…`
                : `Starting in ${countdown}s…`
              : isHi
              ? "व्यायाम शुरू करें"
              : "Start exercise"
            : isHi
            ? "स्थिति ठीक होने पर शुरू होगा"
            : "Waiting for the right position…"}
        </Button>
      ) : (
        <Button
          id="start-camera-btn-bottom"
          size="lg"
          variant="outline"
          className="w-full text-sm font-semibold gap-2"
          onClick={onStartCamera}
        >
          <Play className="size-5" />
          {isHi ? "कैमरा खोलें" : "Open camera"}
        </Button>
      )}
    </div>
  );
}

function CheckRow({
  label,
  passed,
  passText,
  failText,
  isWarning = false,
}: {
  label: string;
  passed: boolean;
  passText: string;
  failText: string;
  isWarning?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      {passed ? (
        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
          <CheckCircle2 className="size-4" /> {passText}
        </span>
      ) : isWarning ? (
        <span className="flex items-center gap-1 text-amber-600">
          <AlertTriangle className="size-4" /> {failText}
        </span>
      ) : (
        <span className="flex items-center gap-1 text-muted-foreground">
          <XCircle className="size-4" /> {failText}
        </span>
      )}
    </div>
  );
}
