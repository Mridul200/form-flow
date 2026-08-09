import React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Footprints, Info, PersonStanding, Play, Target, Timer, XCircle } from "lucide-react";
import {
  getCommonMistakes,
  getExerciseCameraNote,
  getExerciseDescription,
  getExerciseName,
  getExerciseTargetJoint,
  getInstructionSteps,
  getExerciseConfig,
} from "@/lib/exercises/config";
import { useLanguage } from "@/context/LanguageContext";
import { AppFooter, AppHeader, MedicalDisclaimer } from "@/components/layout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/exercise-detail/$exerciseId")({
  head: ({ params }) => {
    const config = getExerciseConfig(params.exerciseId);
    return {
      meta: [
        { title: `${config?.name ?? "Exercise Instructions"} — RehabAI` },
        {
          name: "description",
          content: `Step-by-step instructions, correct form cues, and mistakes for ${config?.name}.`,
        },
      ],
    };
  },
  component: ExerciseDetail,
});

function ExerciseDetail() {
  const { exerciseId } = Route.useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const config = getExerciseConfig(exerciseId);

  if (!config) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader subtitle="Exercise Not Found" />
        <main className="mx-auto flex-1 px-4 py-12 text-center">
          <p className="text-muted-foreground">Exercise not found.</p>
          <Button asChild className="mt-4">
            <Link to="/exercises">{t.backToLibrary}</Link>
          </Button>
        </main>
      </div>
    );
  }

  const name = getExerciseName(config, language);
  const description = getExerciseDescription(config, language);
  const targetJoint = getExerciseTargetJoint(config, language);
  const steps = getInstructionSteps(config, language);
  const mistakes = getCommonMistakes(config, language);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader subtitle={name} />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <Link
          to="/exercises"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          {t.backToLibrary}
        </Link>

        {/* Title Header */}
        <div className="surface-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {language === "hi" ? "सरल अभ्यास" : "Simple rehab"}
              </span>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl mt-0.5">{name}</h1>
            </div>
            {config.holdDuration && (
              <span className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                <Timer className="size-4" />
                {config.holdDuration} {t.holdSeconds}
              </span>
            )}
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>

          {/* Quick Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center gap-2.5 rounded-xl bg-accent/40 p-3 border border-border/40 text-xs">
              <PersonStanding className="size-4 text-primary shrink-0" />
              <div>
                <p className="text-muted-foreground">{t.cameraPose}</p>
                <p className="font-semibold text-foreground capitalize">{config.cameraPosition} View</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-accent/40 p-3 border border-border/40 text-xs">
              <Footprints className="size-4 text-primary shrink-0" />
              <div>
                <p className="text-muted-foreground">{t.targetJoint}</p>
                <p className="font-semibold text-foreground">{targetJoint}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-accent/40 p-3 border border-border/40 text-xs">
              <Target className="size-4 text-primary shrink-0" />
              <div>
                <p className="text-muted-foreground">{t.targetReps}</p>
                <p className="font-semibold text-foreground">{config.targetReps} Reps</p>
              </div>
            </div>
          </div>
        </div>

        {/* A. Simple demonstration steps */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight">{language === "hi" ? "आसान चरण" : "Simple steps"}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, idx) => (
              <div key={step.title} className="surface-card flex flex-col p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {idx + 1}
                  </span>
                  <span className="text-2xl" role="img" aria-label={step.title}>
                    {step.icon}
                  </span>
                </div>
                <h3 className="text-sm font-semibold">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed flex-1">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* B. Step-by-step instructions */}
        <section className="surface-card p-6 space-y-4">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Info className="size-5 text-primary" />
            {language === "hi" ? "छोटे-छोटे चरण" : "Simple instructions"}
          </h2>
          <ol className="space-y-3 text-xs sm:text-sm text-muted-foreground">
            {steps.map((step, idx) => (
              <li key={step.title} className="flex items-start gap-3">
                <span className="font-bold text-foreground shrink-0">{language === "hi" ? `चरण ${idx + 1}:` : `Step ${idx + 1}:`}</span>
                <span>
                  <strong className="text-foreground font-medium">{step.title}</strong> — {step.description}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* C & D. Correct Form & Common Mistakes */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* C. Correct Form */}
          <section className="surface-card p-6 space-y-3 border-l-4 border-l-emerald-500">
            <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="size-5" />
              {language === "hi" ? "सही तरीका" : t.correctForm}
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              {steps.map((s) => (
                <li key={s.title} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">🟢</span>
                  <span>{s.description}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* D. Common Mistakes */}
          <section className="surface-card p-6 space-y-3 border-l-4 border-l-destructive">
            <h3 className="text-base font-bold text-destructive flex items-center gap-2">
              <XCircle className="size-5" />
              {language === "hi" ? "गलती से बचें" : t.commonMistakes}
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              {mistakes.map((m) => (
                <li key={m} className="flex items-start gap-2">
                  <span className="text-destructive font-bold">🔴</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Action Button: Start Camera Test */}
        <div className="surface-card p-6 text-center space-y-4">
          <div>
            <h3 className="text-base font-bold">{language === "hi" ? "अब शुरू करें" : t.readyToStart}</h3>
            <p className="text-xs text-muted-foreground mt-1">{language === "hi" ? "कैमरा खोलें और आसान तरीके से अभ्यास शुरू करें।" : t.readyDesc}</p>
          </div>
          <Button
            size="lg"
            className="w-full sm:w-auto px-8 gap-2 text-base font-semibold shadow-lg"
            onClick={() => navigate({ to: "/exercise", search: { exercise: config.id } })}
          >
            <Play className="size-5" />
            {language === "hi" ? "कैमरा खोलें" : t.startCameraTest}
          </Button>
        </div>

        <MedicalDisclaimer />
      </main>

      <AppFooter />
    </div>
  );
}
