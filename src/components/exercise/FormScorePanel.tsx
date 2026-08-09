import React from "react";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import type { EvaluatedRule } from "@/lib/exercises/ruleEngine";
import { useLanguage } from "@/context/LanguageContext";

interface FormScorePanelProps {
  score: number;
  evaluatedRules: EvaluatedRule[];
}

export function FormScorePanel({ score, evaluatedRules }: FormScorePanelProps) {
  const { language, t } = useLanguage();

  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (s >= 55) return "text-amber-600 dark:text-amber-400";
    return "text-destructive";
  };

  return (
    <div className="surface-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <ShieldCheck className="size-4" />
          <span>{t.formScore}</span>
        </div>
        <span className={`font-display text-2xl font-bold ${getScoreColor(score)}`}>
          {score}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all duration-300 ${
            score >= 80 ? "bg-emerald-500" : score >= 55 ? "bg-amber-500" : "bg-destructive"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Rule breakdown list */}
      <div className="space-y-1.5 pt-1">
        {evaluatedRules.map((rule) => (
          <div
            key={rule.id}
            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-accent/30"
          >
            <span className="font-medium text-foreground">
              {language === "hi" && rule.label_hi ? rule.label_hi : rule.label}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-[11px]">{rule.angle}°</span>
              {rule.passed ? (
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="size-4 text-destructive shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
