import React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Footprints, PersonStanding, Timer, XCircle } from "lucide-react";
import {
  getCommonMistakes,
  getExerciseCameraNote,
  getExerciseDescription,
  getExerciseName,
  getExerciseTargetJoint,
  getInstructionSteps,
  type ExerciseConfig,
} from "@/lib/exercises/config";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";

const CATEGORY_COLORS: Record<ExerciseConfig["category"], string> = {
  ankle: "bg-blue-500/10 text-blue-600 border-blue-300/40",
  knee: "bg-violet-500/10 text-violet-600 border-violet-300/40",
  hip: "bg-emerald-500/10 text-emerald-600 border-emerald-300/40",
  balance: "bg-amber-500/10 text-amber-600 border-amber-300/40",
  "full-body": "bg-rose-500/10 text-rose-600 border-rose-300/40",
};

const DIFFICULTY_COLORS: Record<ExerciseConfig["difficulty"], string> = {
  beginner: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  intermediate: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  advanced: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
};

export function ExerciseCard({ exercise }: { exercise: ExerciseConfig }) {
  const { language, t } = useLanguage();

  const name = getExerciseName(exercise, language);
  const description = getExerciseDescription(exercise, language);
  const targetJoint = getExerciseTargetJoint(exercise, language);
  const cameraNote = getExerciseCameraNote(exercise, language);
  const steps = getInstructionSteps(exercise, language);
  const mistakes = getCommonMistakes(exercise, language);

  return (
    <article className="surface-card flex flex-col gap-4.5 p-5 transition-all hover:shadow-md">
      {/* Visual illustration banner */}
      <div className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border border-border/40 p-4">
        <div className="text-center">
          <span className="text-4xl" role="img" aria-label={name}>
            {exercise.instructionSteps[0]?.icon || "🏋️"}
          </span>
          <p className="mt-1 text-xs font-semibold text-foreground/80">{targetJoint}</p>
        </div>

        <span
          className={`absolute left-3 top-3 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
            CATEGORY_COLORS[exercise.category]
          }`}
        >
          {t[exercise.category as keyof typeof t] || exercise.category}
        </span>

        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
            DIFFICULTY_COLORS[exercise.difficulty]
          }`}
        >
          {exercise.difficulty}
        </span>
      </div>

      {/* Title & Description */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-tight">{name}</h3>
          {exercise.holdDuration && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              <Timer className="size-3" />
              {exercise.holdDuration}{t.holdSeconds}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>

      {/* Target Joint & Pose Specs */}
      <div className="space-y-1.5 rounded-lg bg-muted/40 p-3 text-xs">
        <div className="flex items-center gap-2">
          <PersonStanding className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-muted-foreground">{cameraNote}</span>
        </div>
        <div className="flex items-center gap-2">
          <Footprints className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">
            <strong className="text-foreground font-medium">{t.targetJoint}: </strong>
            {targetJoint}
          </span>
        </div>
      </div>

      {/* Correct & Common Mistakes snippet */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-emerald-500/5 p-2 border border-emerald-500/10">
          <p className="mb-1 flex items-center gap-1 font-semibold text-emerald-600">
            <CheckCircle2 className="size-3" /> {t.correctForm}
          </p>
          <ul className="space-y-1 text-[11px] text-muted-foreground">
            {steps.slice(0, 2).map((s) => (
              <li key={s.title} className="line-clamp-1">
                • {s.title}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg bg-rose-500/5 p-2 border border-rose-500/10">
          <p className="mb-1 flex items-center gap-1 font-semibold text-destructive">
            <XCircle className="size-3" /> {t.commonMistakes}
          </p>
          <ul className="space-y-1 text-[11px] text-muted-foreground">
            {mistakes.slice(0, 2).map((m) => (
              <li key={m} className="line-clamp-1">
                • {m}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action CTA button */}
      <Button asChild className="mt-auto w-full gap-2" size="default">
        <Link to="/exercise-detail/$exerciseId" params={{ exerciseId: exercise.id }}>
          {t.viewInstructions}
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </article>
  );
}
