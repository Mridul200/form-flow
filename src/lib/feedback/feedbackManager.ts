/**
 * Unified Feedback Manager.
 * Connects rule evaluation results to UI text, VoiceService spoken audio, and Canvas body-part overlay highlights.
 * Uses priority selection (CRITICAL > MAJOR > MODERATE > MINOR) and audio speech cooldowns.
 */

import type { FormError } from "@/lib/pose/squat/squatRules";
import type { VoiceService } from "@/lib/exercises/voiceService";
import type { FormStatus } from "@/lib/types";

export interface UnifiedFeedbackState {
  primaryError: FormError | null;
  formStatus: FormStatus;
  textEn: string;
  textHi: string;
  affectedBodyParts: string[];
}

export class FeedbackManager {
  private lastSpokenText = "";
  private lastSpokenTime = 0;
  private voiceCooldownMs: number;

  constructor(voiceCooldownMs = 4000) {
    this.voiceCooldownMs = voiceCooldownMs;
  }

  processFeedback(
    errors: FormError[],
    isLandmarksVisible: boolean,
    voiceService?: VoiceService,
    language: "en" | "hi" = "en"
  ): UnifiedFeedbackState {
    if (!isLandmarksVisible) {
      const msgEn = "Please step back so your full body is visible in camera.";
      const msgHi = "Kripya peeche hatein taaki aapka poora sharir dikhe.";
      return {
        primaryError: null,
        formStatus: "warning",
        textEn: msgEn,
        textHi: msgHi,
        affectedBodyParts: ["camera"],
      };
    }

    if (!errors.length) {
      return {
        primaryError: null,
        formStatus: "good",
        textEn: "Great form! Keep squatting smoothly.",
        textHi: "Bahut badhiya form hai! Aise hi jaari rakhein.",
        affectedBodyParts: [],
      };
    }

    // Sort errors by severity priority: CRITICAL > MAJOR > MODERATE > MINOR
    const sorted = [...errors].sort((a, b) => this.severityWeight(b.severity) - this.severityWeight(a.severity));
    const primary = sorted[0] ?? null;

    if (!primary) {
      return {
        primaryError: null,
        formStatus: "good",
        textEn: "Great form! Keep squatting smoothly.",
        textHi: "Bahut badhiya form hai! Aise hi jaari rakhein.",
        affectedBodyParts: [],
      };
    }

    const affectedBodyParts = sorted.map((e) => e.bodyPart);
    const textEn = primary.messageEn;
    const textHi = primary.messageHi;

    const formStatus: FormStatus = primary.severity === "CRITICAL" ? "bad" : "warning";

    // Trigger spoken voice if voiceService is active and cooldown has passed
    if (voiceService) {
      const now = Date.now();
      const speakText = language === "hi" ? textHi : textEn;

      if (speakText !== this.lastSpokenText || now - this.lastSpokenTime > this.voiceCooldownMs) {
        this.lastSpokenText = speakText;
        this.lastSpokenTime = now;
        voiceService.playBeep(formStatus === "bad" ? "warning" : "success");
        voiceService.speak(speakText);
      }
    }

    return {
      primaryError: primary,
      formStatus,
      textEn,
      textHi,
      affectedBodyParts,
    };
  }

  private severityWeight(severity: string): number {
    switch (severity) {
      case "CRITICAL": return 4;
      case "MAJOR": return 3;
      case "MODERATE": return 2;
      case "MINOR": return 1;
      default: return 0;
    }
  }

  reset() {
    this.lastSpokenText = "";
    this.lastSpokenTime = 0;
  }
}
