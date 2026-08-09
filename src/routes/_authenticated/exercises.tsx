import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Sparkles } from "lucide-react";
import {
  EXERCISE_CONFIGS,
  getExerciseDescription,
  getExerciseName,
  getExerciseTargetJoint,
  type ExerciseConfig,
} from "@/lib/exercises/config";
import { useLanguage } from "@/context/LanguageContext";
import { ExerciseCard } from "@/components/exercise/ExerciseCard";
import { AppFooter, AppHeader } from "@/components/layout";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/exercises")({
  head: () => ({
    meta: [
      { title: "Exercise Library — RehabAI" },
      {
        name: "description",
        content: "Comprehensive library of 10 AI-guided physiotherapeutic exercises with pose tracking.",
      },
    ],
  }),
  component: ExerciseLibrary,
});

const ALL_EXERCISES = Object.values(EXERCISE_CONFIGS);

function ExerciseLibrary() {
  const { language, t } = useLanguage();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ExerciseConfig["category"] | "all">("all");

  const categories: { id: ExerciseConfig["category"] | "all"; label: string }[] = [
    { id: "all", label: t.all },
    { id: "ankle", label: t.ankle },
    { id: "knee", label: t.knee },
    { id: "hip", label: t.hip },
    { id: "balance", label: t.balance },
  ];

  const filtered = ALL_EXERCISES.filter((e) => {
    const matchesCategory = selectedCategory === "all" || e.category === selectedCategory;
    const name = getExerciseName(e, language);
    const description = getExerciseDescription(e, language);
    const targetJoint = getExerciseTargetJoint(e, language);
    const matchesSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      description.toLowerCase().includes(search.toLowerCase()) ||
      targetJoint.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader subtitle={t.exercises} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 space-y-8">
        {/* Header Hero */}
        <div className="space-y-3 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" />
            <span>{t.aiGuidedSubtitle}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.exercises}</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">{t.libraryDesc}</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:bg-accent"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise Grid */}
        {filtered.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ex) => (
              <ExerciseCard key={ex.id} exercise={ex} />
            ))}
          </div>
        ) : (
          <div className="surface-card p-12 text-center space-y-2">
            <p className="text-base font-semibold">{t.noMatchSearch}</p>
            <p className="text-xs text-muted-foreground">{t.tryAdjustFilters}</p>
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
