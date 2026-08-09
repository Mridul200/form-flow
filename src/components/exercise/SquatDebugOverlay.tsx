import React from "react";
import type { SquatEngineFrameResult } from "@/lib/pose/squat/engine";

interface SquatDebugOverlayProps {
  engineResult: SquatEngineFrameResult | null;
  fps: number;
}

export function SquatDebugOverlay({ engineResult, fps }: SquatDebugOverlayProps) {
  if (!engineResult) return null;

  const {
    systemState,
    movementPhase,
    formStatus,
    poseConfidence,
    features,
    activeErrors,
    feedback,
    repCount,
    validReps,
    invalidReps,
    overallScore,
  } = engineResult;

  const statusColor =
    formStatus === "good"
      ? "text-emerald-400"
      : formStatus === "warning"
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div className="absolute top-4 left-4 z-50 w-72 rounded-lg border border-slate-700 bg-slate-900/90 p-3 text-xs font-mono text-slate-200 shadow-xl backdrop-blur-sm pointer-events-none">
      <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
        <span className="font-bold text-teal-400">POSE DEBUG OVERLAY</span>
        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
          {fps} FPS
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-400">System State:</span>
          <span className="font-semibold text-slate-100">{systemState}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Pose Confidence:</span>
          <span className="font-semibold text-slate-100">{poseConfidence}%</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Movement Phase:</span>
          <span className="font-semibold text-indigo-400">{movementPhase}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Form Status:</span>
          <span className={`font-semibold capitalize ${statusColor}`}>{formStatus}</span>
        </div>

        <div className="my-1.5 border-t border-slate-800 pt-1.5 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">L/R Knee Angle:</span>
            <span>
              {features.leftKneeAngle}° / {features.rightKneeAngle}°
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Torso Lean:</span>
            <span>{features.torsoLeanAngle}°</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Valgus Ratio:</span>
            <span>L: {features.leftKneeValgusRatio} | R: {features.rightKneeValgusRatio}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Angular Velocity:</span>
            <span>{features.kneeVelocity} deg/s</span>
          </div>
        </div>

        <div className="my-1.5 border-t border-slate-800 pt-1.5 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Active Errors ({activeErrors.length}):</span>
            <span className="text-amber-400">{activeErrors.length ? activeErrors[0]?.errorType : "None"}</span>
          </div>

          {activeErrors.length > 0 && (
            <div className="text-[11px] text-amber-300 bg-amber-950/40 p-1 rounded border border-amber-800/50">
              {feedback.textEn}
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 pt-1.5 flex justify-between font-semibold">
          <span>Reps: {repCount} (✓{validReps} / ✗{invalidReps})</span>
          <span className="text-teal-400">Score: {overallScore}%</span>
        </div>
      </div>
    </div>
  );
}
