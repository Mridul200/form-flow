import React from "react";
import { Gauge } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface JointAngleDisplayProps {
  angles: Record<string, number | string>;
}

const LABEL_HI: Record<string, string> = {
  Knee: "घुटना (Knee)",
  Hip: "कूल्हा (Hip)",
  Ankle: "टखना (Ankle)",
  Elevation: "ऊंचाई (Elevation)",
  Opening: "खुलना (Opening)",
  "Pelvic Tilt": "पेल्विक झुकाव",
  "L Knee": "बायां घुटना",
  "R Knee": "दायां घुटना",
  "Heel Raise": "एड़ी का उठना",
  "Hip Level": "हिप स्तर",
  Trunk: "शरीर संतुलन",
};

export function JointAngleDisplay({ angles }: JointAngleDisplayProps) {
  const { language, t } = useLanguage();
  const entries = Object.entries(angles);

  if (!entries.length) {
    return (
      <div className="surface-card p-4 text-center">
        <p className="text-xs text-muted-foreground">
          {language === "hi" ? "कोणों की गणना की प्रतीक्षा में…" : "Waiting for joint angles…"}
        </p>
      </div>
    );
  }

  return (
    <div className="surface-card p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        <Gauge className="size-3.5" />
        <span>{t.liveJointAngles}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {entries.map(([label, val]) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center rounded-xl bg-accent/50 p-3 text-center border border-border/40"
          >
            <span className="text-[11px] font-medium text-muted-foreground">
              {language === "hi" ? LABEL_HI[label] || label : label}
            </span>
            <span className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">
              {typeof val === "number" ? `${val}°` : val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
