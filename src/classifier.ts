import Anthropic from "@anthropic-ai/sdk";
import type { ClassifiedSentence, SentenceCategory } from "./types";

const SYSTEM_PROMPT = `You are an argument analyst. For each numbered sentence, identify its rhetorical role in the article.

Categories:
- Claim: A statement the author asserts as true that requires support
- Evidence: Data, quotes, studies, or facts used to support a claim
- Counter-argument: A position the author acknowledges that opposes the main argument
- Opinion: A subjective view, belief, or value judgement (author's or cited source's)
- Other: Transitions, background context, definitions, or structural sentences

Be concise and consistent. Classify based on function, not topic.`;

const CLASSIFICATION_SCHEMA = {
  type: "object" as const,
  properties: {
    classifications: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          index: { type: "number" as const },
          category: {
            type: "string" as const,
            enum: [
              "Claim",
              "Evidence",
              "Counter-argument",
              "Opinion",
              "Other",
            ],
          },
          confidence: { type: "number" as const },
        },
        required: ["index", "category", "confidence"],
      },
    },
  },
  required: ["classifications"],
};

export async function classifyBatch(
  sentences: string[],
  apiKey: string,
  startIndex: number = 0
): Promise<ClassifiedSentence[]> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const numbered = sentences
    .map((s, i) => `${startIndex + i}. ${s}`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: numbered }],
    tools: [
      {
        name: "classify_sentences",
        description: "Classify each sentence by its argumentative role",
        input_schema: CLASSIFICATION_SCHEMA,
      },
    ],
    tool_choice: { type: "tool", name: "classify_sentences" },
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("No tool use block in response");
  }

  const input = toolUse.input as {
    classifications: Array<{
      index: number;
      category: string;
      confidence: number;
    }>;
  };

  return input.classifications.map((c) => ({
    id: c.index,
    text: sentences[c.index - startIndex],
    category: c.category as SentenceCategory,
    confidence: Math.round(c.confidence * 100) / 100,
  }));
}

export async function classifyAll(
  sentences: string[],
  apiKey: string,
  onProgress?: (processed: number, total: number) => void
): Promise<ClassifiedSentence[]> {
  const BATCH_SIZE = 40;
  const results: ClassifiedSentence[] = [];

  for (let i = 0; i < sentences.length; i += BATCH_SIZE) {
    const batch = sentences.slice(i, i + BATCH_SIZE);
    const classified = await classifyBatch(batch, apiKey, i);
    results.push(...classified);
    onProgress?.(Math.min(i + BATCH_SIZE, sentences.length), sentences.length);
  }

  return results;
}
