import React, { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import {
  CircleStop,
  Loader2,
  AlertCircle,
  Timer,
  Hash,
  TrendingUp,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useExerciseEngine } from "@/hooks/useExerciseEngine";
import { getExerciseName, getExerciseConfig } from "@/lib/exercises/config";
import { generateSessionSummary } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import { AppHeader, MedicalDisclaimer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { JointAngleDisplay } from "@/components/exercise/JointAngleDisplay";
import { FormScorePanel } from "@/components/exercise/FormScorePanel";
import { VoiceSettings } from "@/components/exercise/VoiceSettings";
import { CameraCheck } from "@/components/exercise/CameraCheck";
import { SquatDebugOverlay } from "@/components/exercise/SquatDebugOverlay";
import type { FormStatus } from "@/lib/types";

const searchSchema = z.object({ exercise: z.string().default("squat") });

export const Route = createFileRoute("/_authenticated/exercise")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Live Exercise Session — RehabAI" },
      {
        name: "description",
        content: "Real-time AI posture & form analysis with live joint angle calculation.",
      },
    ],
  }),
  component: ExerciseSession,
});

const STATUS_STYLES: Record<FormStatus, string> = {
  good: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  bad: "border-destructive/40 bg-destructive/10 text-destructive",
};

/** Format elapsed seconds as MM:SS */
function formatTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function ExerciseSession() {
  const { exercise: exerciseId } = Route.useSearch();
  const { userId } = useSession();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isHi = language === "hi";

  const [saving, setSaving] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  // false = Camera Check phase, true = Live Session phase
  const [sessionStarted, setSessionStarted] = useState(false);

  const config = getExerciseConfig(exerciseId) ?? getExerciseConfig("slr")!;
  const engine = useExerciseEngine(videoRef, config.id);
  const name = getExerciseName(config, language);

  const statusLabels: Record<FormStatus, string> = {
    good: isHi ? "ठीक है" : t.goodFormLabel,
    warning: isHi ? "सुधार करें" : t.adjustFormLabel,
    bad: isHi ? "ग़लत तरीका" : t.incorrectFormLabel,
  };

  async function endSession() {
    if (!userId) return;
    setSaving(true);
    const snapshot = {
      accuracy: engine.formScore,
      validReps: engine.validReps,
      invalidReps: engine.invalidReps,
      corrections: engine.topCorrections,
      duration: engine.elapsedSeconds,
    };
    engine.stop();

    try {
      let summary = "";
      try {
        const res = await generateSessionSummary({
          data: {
            exercise: config.name,
            accuracy: snapshot.accuracy,
            validReps: snapshot.validReps,
            invalidReps: snapshot.invalidReps,
            corrections: snapshot.corrections,
          },
        });
        summary = res.text;
      } catch {
        summary = "";
      }

      const { data, error } = await supabase
        .from("sessions")
        .insert({
          user_id: userId,
          exercise: config.name,
          accuracy: snapshot.accuracy,
          valid_reps: snapshot.validReps,
          invalid_reps: snapshot.invalidReps,
          duration_seconds: snapshot.duration,
          corrections: snapshot.corrections,
          summary,
        })
        .select("id")
        .single();

      if (error) throw error;
      navigate({ to: "/summary/$sessionId", params: { sessionId: data.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the session");
      setSaving(false);
    }
  }

  // Progress percentage toward target reps
  const progressPct = Math.min(100, Math.round((engine.validReps / config.targetReps) * 100));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader subtitle={name} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {/* Phase 1: Camera Positioning Check */}
        {!sessionStarted ? (
          <div className="space-y-6">
            <CameraCheck
              exercise={config}
              videoRef={videoRef}
              canvasRef={engine.canvasRef}
              running={engine.running}
              ready={engine.ready}
              landmarksVisible={engine.landmarksVisible}
              error={engine.error}
              onStartCamera={engine.start}
              onConfirmStartExercise={() => setSessionStarted(true)}
              validReps={engine.validReps}
              elapsedSeconds={engine.elapsedSeconds}
            />
          </div>
        ) : (
          /* Phase 2: Live Exercise Session UI */
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            {/* LEFT: Camera Feed + Feedback Banner + Disclaimer */}
            <div className="space-y-4">
              <div className="surface-card overflow-hidden relative shadow-lg">
                <div className="relative aspect-video bg-foreground/90 overflow-hidden rounded-t-2xl">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="absolute inset-0 size-full scale-x-[-1] object-cover"
                  />
                  <canvas
                    ref={engine.canvasRef}
                    className="absolute inset-0 size-full scale-x-[-1] object-cover"
                  />

                  {showDebug && (
                    <SquatDebugOverlay engineResult={engine.debugResult} fps={engine.fps} />
                  )}

                  {/* Form Status Badge - top left */}
                  <span
                    className={`absolute left-4 top-4 rounded-full border px-3 py-1.5 text-xs font-bold shadow-md backdrop-blur-md ${
                      STATUS_STYLES[engine.formStatus]
                    }`}
                  >
                    {statusLabels[engine.formStatus]}
                  </span>

                  {/* ────── LIVE REP COUNTER BADGE (top-right on video) ────── */}
                  <div className="absolute right-4 top-4 flex flex-col gap-2 z-10">
                    <button
                      onClick={() => setShowDebug((v) => !v)}
                      className="rounded-xl bg-black/75 px-3 py-1 text-[11px] font-mono text-teal-300 backdrop-blur-sm border border-teal-500/40 hover:bg-black/90 transition"
                    >
                      {showDebug ? (isHi ? "डिबग छिपाएँ" : "Hide debug") : (isHi ? "डिबग देखें" : "Debug mode")}
                    </button>
                    {/* Rep counter */}
                    <div className="flex items-center gap-2 rounded-xl bg-black/75 px-3 py-1.5 text-white backdrop-blur-sm shadow-md border border-emerald-500/40">
                      <Hash className="size-3.5 text-emerald-400" />
                      <span className="text-lg font-extrabold tabular-nums text-emerald-300 leading-none">
                        {String(engine.validReps).padStart(2, "0")}
                      </span>
                      <span className="text-[10px] text-slate-300 font-semibold">
                        / {config.targetReps} {isHi ? "रेप्स" : "reps"}
                      </span>
                    </div>
                    {/* Timer */}
                    <div className="flex items-center gap-2 rounded-xl bg-black/75 px-3 py-1.5 text-white backdrop-blur-sm shadow-md">
                      <Timer className="size-3.5 text-sky-400" />
                      <span className="text-sm font-bold tabular-nums text-sky-300">
                        {formatTime(engine.elapsedSeconds)}
                      </span>
                    </div>
                    {/* Hold timer badge if applicable */}
                    {config.holdDuration && engine.holdSecondsLeft > 0 && (
                      <div className="rounded-xl bg-primary/90 px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-md animate-pulse text-center">
                        {isHi ? `रुकें: ${engine.holdSecondsLeft} sec` : `Hold: ${engine.holdSecondsLeft}s`}
                      </div>
                    )}
                  </div>
                </div>

                {/* Real-time Feedback Banner */}
                <div className="border-t border-border bg-card p-4 flex items-center gap-3">
                  <div
                    className={`size-3 rounded-full shrink-0 ${
                      engine.formStatus === "good"
                        ? "bg-emerald-500"
                        : engine.formStatus === "warning"
                        ? "bg-amber-500"
                        : "bg-destructive animate-ping"
                    }`}
                  />
                  <p className="text-sm font-semibold text-foreground flex-1">
                    {engine.feedbackText}
                  </p>
                </div>
              </div>

              {/* Safety Disclaimer */}
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground flex items-start gap-2">
                <AlertCircle className="size-4 text-primary shrink-0 mt-0.5" />
                <p>{t.disclaimer}</p>
              </div>
            </div>

            {/* RIGHT: Live Dashboard Sidebar */}
            <div className="space-y-4">
              {/* ══════════ LIVE STATS HERO CARD ══════════ */}
              <div className="surface-card p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="size-4" />
                  {isHi ? "लाइव आंकड़े" : "Live Stats"}
                </h3>

                {/* Rep Count — Large Display */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      {isHi ? "सही रेप्स" : "Valid reps"}
                    </p>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span
                        id="live-rep-count"
                        className="font-display text-6xl font-extrabold tracking-tight text-foreground transition-all"
                      >
                        {String(engine.validReps).padStart(2, "0")}
                      </span>
                      <span className="text-2xl font-medium text-muted-foreground">
                        / {String(config.targetReps).padStart(2, "0")}
                      </span>
                    </div>
                  </div>

                  {/* Timer — Large Display */}
                  <div className="text-right">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      {isHi ? "समय" : "Elapsed"}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <Timer className="size-4 text-sky-500" />
                      <span
                        id="live-timer"
                        className="font-display text-3xl font-bold tracking-tight text-sky-600 dark:text-sky-400 tabular-nums"
                      >
                        {formatTime(engine.elapsedSeconds)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rep Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-muted-foreground">{isHi ? "लक्ष्य प्रगति" : "Progress toward target"}</span>
                    <span className="text-primary">{progressPct}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Valid/Invalid breakdown */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1">
                      <CheckCircle2 className="size-3.5" />
                      {isHi ? "सही रेप्स" : "Valid"}
                    </div>
                    <span className="font-display text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                      {engine.validReps}
                    </span>
                  </div>
                  <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-destructive uppercase tracking-wide mb-1">
                      <XCircle className="size-3.5" />
                      {isHi ? "गलत रेप्स" : "Invalid"}
                    </div>
                    <span className="font-display text-2xl font-extrabold text-destructive">
                      {engine.invalidReps}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Score Panel */}
              <FormScorePanel score={engine.formScore} evaluatedRules={engine.evaluatedRules} />

              {/* Joint Angle Display */}
              <JointAngleDisplay angles={engine.angles} />

              {/* Audio & Voice Settings */}
              <VoiceSettings settings={engine.audioSettings} onChange={engine.updateAudioSettings} />

              {/* End Session Button */}
              <Button
                id="end-session-btn"
                size="lg"
                variant="destructive"
                className="w-full gap-2 text-base font-bold shadow-md"
                disabled={saving}
                onClick={endSession}
              >
                {saving ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <CircleStop className="size-5" />
                )}
                {saving ? (isHi ? "सहेजा जा रहा है…" : t.savingSession) : (isHi ? "सत्र खत्म करें" : t.endSession)}
              </Button>
            </div>
          </div>
        )}
      </main>

      <MedicalDisclaimer className="my-4 text-center text-xs text-muted-foreground" />
    </div>
  );
}
