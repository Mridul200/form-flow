import React from "react";
import { Volume2, VolumeX, Bell, BellOff } from "lucide-react";
import type { AudioSettings } from "@/lib/exercises/voiceService";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";

interface VoiceSettingsProps {
  settings: AudioSettings;
  onChange: (updated: Partial<AudioSettings>) => void;
}

export function VoiceSettings({ settings, onChange }: VoiceSettingsProps) {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageSwitch = (lang: "en" | "hi") => {
    setLanguage(lang);
    onChange({ language: lang });
  };

  return (
    <div className="surface-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <Volume2 className="size-4" />
          <span>{t.audioAssistant}</span>
        </h4>

        {/* Language selector toggle */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          <Button
            size="sm"
            variant={language === "en" ? "default" : "ghost"}
            className="h-6 text-xs px-2"
            onClick={() => handleLanguageSwitch("en")}
          >
            English
          </Button>
          <Button
            size="sm"
            variant={language === "hi" ? "default" : "ghost"}
            className="h-6 text-xs px-2"
            onClick={() => handleLanguageSwitch("hi")}
          >
            हिन्दी
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Voice ON/OFF */}
        <Button
          variant={settings.voiceEnabled ? "default" : "outline"}
          size="sm"
          className="w-full justify-start gap-2 h-9 text-xs"
          onClick={() => onChange({ voiceEnabled: !settings.voiceEnabled })}
        >
          {settings.voiceEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          <span>{settings.voiceEnabled ? t.voiceOn : t.voiceOff}</span>
        </Button>

        {/* Beep ON/OFF */}
        <Button
          variant={settings.beepEnabled ? "default" : "outline"}
          size="sm"
          className="w-full justify-start gap-2 h-9 text-xs"
          onClick={() => onChange({ beepEnabled: !settings.beepEnabled })}
        >
          {settings.beepEnabled ? <Bell className="size-4" /> : <BellOff className="size-4" />}
          <span>{settings.beepEnabled ? t.beepOn : t.beepOff}</span>
        </Button>
      </div>

      {/* Volume slider */}
      {settings.voiceEnabled && (
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t.volume}</span>
            <span>{Math.round(settings.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.volume}
            onChange={(e) => onChange({ volume: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      )}
    </div>
  );
}
