import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MODEL = "google/gemini-3.5-flash";
const API_KEY_ENV = "AI_API_KEY";
const LEGACY_API_KEY_ENV = "LOVABLE_API_KEY";

const FeedbackInput = z.object({
  exercise: z.string(),
  formStatus: z.enum(["good", "warning", "bad"]),
  repCount: z.number(),
  accuracy: z.number(),
  issues: z.array(z.string()).max(5),
});

const SummaryInput = z.object({
  exercise: z.string(),
  accuracy: z.number(),
  validReps: z.number(),
  invalidReps: z.number(),
  corrections: z.array(z.string()).max(5),
});

function getApiKey() {
  return process.env[API_KEY_ENV] ?? process.env[LEGACY_API_KEY_ENV];
}

/** Short, encouraging, specific coaching sentence for the live feedback banner. */
export const generateFeedbackText = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FeedbackInput.parse(input))
  .handler(async ({ data }) => {
    const key = getApiKey();
    if (!key) return { text: fallbackFeedback(data.formStatus, data.issues) };

    try {
      const { generateText } = await import("ai");
      const { createAiGatewayProvider } = await import("./ai-gateway.server");
      const gateway = createAiGatewayProvider(key);
      const result = await generateText({
        model: gateway(MODEL),
        system:
          "You are a warm, concise physiotherapy coach. Reply with ONE sentence under 14 words. Be specific and encouraging. No emojis, no greetings, no markdown.",
        prompt: `Exercise: ${data.exercise}. Form: ${data.formStatus}. Reps: ${data.repCount}. Accuracy: ${data.accuracy}%. Detected issues: ${data.issues.join("; ") || "none"}.`,
      });
      const text = (await result.text).trim();
      return { text: text || fallbackFeedback(data.formStatus, data.issues) };
    } catch {
      return { text: fallbackFeedback(data.formStatus, data.issues) };
    }
  });

/** 2-3 sentence natural-language recap of a finished session. */
export const generateSessionSummary = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SummaryInput.parse(input))
  .handler(async ({ data }) => {
    const key = getApiKey();
    if (!key) return { text: fallbackSummary(data) };

    try {
      const { generateText } = await import("ai");
      const { createAiGatewayProvider } = await import("./ai-gateway.server");
      const gateway = createAiGatewayProvider(key);
      const result = await generateText({
        model: gateway(MODEL),
        system:
          "You are a physiotherapy coach writing a session recap for a patient. Exactly 2-3 sentences, plain text, encouraging but honest, mention one concrete thing to work on next time. No markdown, no lists.",
        prompt: `Exercise: ${data.exercise}. Accuracy: ${data.accuracy}%. Valid reps: ${data.validReps}. Invalid reps: ${data.invalidReps}. Most frequent form corrections: ${data.corrections.join("; ") || "none"}.`,
      });
      const text = (await result.text).trim();
      return { text: text || fallbackSummary(data) };
    } catch {
      return { text: fallbackSummary(data) };
    }
  });

function fallbackFeedback(status: "good" | "warning" | "bad", issues: string[]): string {
  if (status === "good") return "Great control — keep that tempo steady.";
  return issues[0] ?? "Slow down and reset your stance.";
}

function fallbackSummary(d: z.infer<typeof SummaryInput>): string {
  const focus = d.corrections[0] ?? "keeping a steady tempo";
  return `You completed ${d.validReps} clean ${d.exercise} reps at ${d.accuracy}% average form accuracy. ${d.invalidReps} reps fell outside the target range. Next session, focus on ${focus.toLowerCase()}.`;
}
