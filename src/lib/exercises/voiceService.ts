/**
 * Voice & Audio Feedback Service.
 * Implements Web Speech API for text-to-speech (EN / HI) and AudioContext for beeps.
 * Includes a smart cooldown system to avoid repeating feedback too rapidly.
 */

export type VoiceLanguage = "en" | "hi";

export interface AudioSettings {
  voiceEnabled: boolean;
  beepEnabled: boolean;
  volume: number; // 0.0 to 1.0
  language: VoiceLanguage;
}

export class VoiceService {
  private settings: AudioSettings = {
    voiceEnabled: true,
    beepEnabled: true,
    volume: 0.8,
    language: "en",
  };

  private audioCtx: AudioContext | null = null;
  private lastSpokenTime = 0;
  private lastSpokenMessage = "";
  private cooldownMs = 2500; // 2.5s cooldown for identical/similar messages

  constructor(initialSettings?: Partial<AudioSettings>) {
    if (initialSettings) {
      this.settings = { ...this.settings, ...initialSettings };
    }
  }

  updateSettings(newSettings: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  /** Play a short feedback beep */
  playBeep(type: "success" | "warning" = "warning") {
    if (!this.settings.beepEnabled || typeof window === "undefined") return;
    try {
      if (!this.audioCtx) {
        const AudioContextClass =
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === "suspended") {
        void this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type === "success" ? "sine" : "triangle";
      osc.frequency.setValueAtTime(
        type === "success" ? 880 : 440,
        this.audioCtx.currentTime
      );

      gain.gain.setValueAtTime(this.settings.volume * 0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        this.audioCtx.currentTime + (type === "success" ? 0.15 : 0.25)
      );

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + (type === "success" ? 0.15 : 0.25));
    } catch {
      // AudioContext failure fallback
    }
  }

  /** Speak a correction or encouragement message with cooldown checking */
  speak(message: string, force = false): boolean {
    if (!this.settings.voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return false;
    }

    const now = Date.now();
    if (!force && message === this.lastSpokenMessage && now - this.lastSpokenTime < this.cooldownMs) {
      return false;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.volume = this.settings.volume;
      utterance.rate = 1.0;
      utterance.lang = this.settings.language === "hi" ? "hi-IN" : "en-IN";

      // Attempt to pick a voice matching language if available
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find((v) =>
        this.settings.language === "hi"
          ? v.lang.startsWith("hi")
          : v.lang.startsWith("en")
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      window.speechSynthesis.speak(utterance);
      this.lastSpokenTime = now;
      this.lastSpokenMessage = message;
      return true;
    } catch {
      return false;
    }
  }

  /** Stop all current speech output */
  stop() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }
}
