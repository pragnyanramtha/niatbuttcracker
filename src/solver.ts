import Groq from "groq-sdk";
import type { Question, QuestionOption } from "./types.js";

let groqClient: Groq | null = null;

export function initGroq(apiKey: string): void {
  groqClient = new Groq({ apiKey });
}

function buildPrompt(question: Question): string {
  const parts: string[] = [];

  const questionText = question.question.content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "");

  parts.push(`Question: ${questionText}`);

  if (question.code_analysis?.code_details) {
    const { code, language } = question.code_analysis.code_details;
    parts.push(
      `\nCode (${language}):\n\`\`\`${language.toLowerCase()}\n${code}\n\`\`\``,
    );
  }

  parts.push("\nOptions:");
  for (const opt of question.options) {
    const text = opt.content.replace(/<[^>]+>/g, "");
    parts.push(`  [${opt.option_id}] ${text}`);
  }

  parts.push(
    "\nRespond with ONLY the option_id of the correct answer. No explanation, no quotes, just the UUID.",
  );

  return parts.join("\n");
}

function pickBestOptionId(
  responseText: string,
  options: QuestionOption[],
): string {
  // Try to find a UUID matching one of the option IDs in the response
  const uuidPattern =
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  const matches = responseText.match(uuidPattern) ?? [];
  const optionIds = new Set(options.map((o) => o.option_id.toLowerCase()));

  for (const match of matches) {
    if (optionIds.has(match.toLowerCase())) {
      return match.toLowerCase() === match
        ? options.find((o) => o.option_id.toLowerCase() === match)!.option_id
        : match;
    }
  }

  // Fallback: first option
  return options[0]!.option_id;
}

const MODELS = [
  "openai/gpt-oss-120b",
  "moonshotai/kimi-k2-instruct-0905",
  "moonshotai/kimi-k2-instruct",
  "llama-3.3-70b-versatile"
];

export async function solveQuestion(question: Question): Promise<string> {
  if (!groqClient)
    throw new Error("Groq not initialised. Call initGroq() first.");

  const prompt = buildPrompt(question);
  let lastError: unknown;

  for (const model of MODELS) {
    try {
      const completion = await groqClient.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are an expert at answering multiple-choice questions accurately. You always respond with only the option_id UUID, nothing else.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 64,
        temperature: 0,
      });

      const answer = completion.choices[0]?.message?.content?.trim() ?? "";
      return pickBestOptionId(answer, question.options);
    } catch (err) {
      console.warn(`[Groq fallback] Model ${model} failed. Trying next...`);
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("All Groq models failed.");
}

export async function solveAll(
  questions: Question[],
  onProgress?: (done: number, total: number) => void,
): Promise<Map<string, string>> {
  const answers = new Map<string, string>();

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]!;

    // Only handle multiple-choice variants - skip types that need code writing
    if (
      q.question_type !== "MULTIPLE_CHOICE" &&
      q.question_type !== "CODE_ANALYSIS_MULTIPLE_CHOICE"
    ) {
      // Fallback: pick first option rather than skipping entirely
      answers.set(q.question_id, q.options[0]?.option_id ?? "");
      onProgress?.(i + 1, questions.length);
      continue;
    }

    try {
      const optionId = await solveQuestion(q);
      answers.set(q.question_id, optionId);
    } catch {
      // On Groq failure, pick the first option as safe fallback
      answers.set(q.question_id, q.options[0]?.option_id ?? "");
    }

    onProgress?.(i + 1, questions.length);

    // Small delay to avoid hitting Groq rate limits
    if (i < questions.length - 1) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return answers;
}
