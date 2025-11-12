import OpenAI from "openai";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

type Persona = {
  id: number;
  name: string;
  role?: string | null;
  description?: string | null;
  traits?: any | null; // JSON
};

export type LLMResponse = {
  preference: "A" | "B";
  rationale: string;
  confidence: number; // 0..1
  raw?: string;
};

let cachedApiKey: string | null = null;
let cachedClient: OpenAI | null = null;

async function loadApiKey(): Promise<string> {
  if (cachedApiKey) return cachedApiKey as string;

  const secretName = process.env.OPENAI_SECRET_NAME;
  const secretRegion = process.env.OPENAI_REGION;

  // Prefer Secrets Manager if configured
  if (secretName && secretRegion) {
    const sm = new SecretsManagerClient({ region: secretRegion });
    const res = await sm.send(new GetSecretValueCommand({ SecretId: secretName }));
    const secretString = res.SecretString;
    if (!secretString) throw new Error("Secrets Manager returned empty SecretString for OpenAI key");
    const parsed = JSON.parse(secretString);
    if (!parsed.OPENAI_API_KEY) throw new Error("Secret missing OPENAI_API_KEY field");
    cachedApiKey = parsed.OPENAI_API_KEY;
    return cachedApiKey as string;
  }

  // Fallback to environment variable for local dev
  const envKey = process.env.OPENAI_API_KEY;
  if (!envKey) throw new Error("OpenAI API key not found (Secrets Manager or OPENAI_API_KEY env)");
  cachedApiKey = envKey;
  return cachedApiKey as string;
}

async function getClient(): Promise<OpenAI> {
  if (cachedClient) return cachedClient;
  const key = await loadApiKey();
  cachedClient = new OpenAI({ apiKey: key });
  return cachedClient;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function personaToText(persona: Persona): string {
  const traits = persona.traits ? JSON.stringify(persona.traits) : "";
  return [
    `Name: ${persona.name}`,
    persona.role ? `Role: ${persona.role}` : "",
    persona.description ? `Description: ${persona.description}` : "",
    traits ? `Traits (JSON): ${traits}` : "",
  ].filter(Boolean).join("\n");
}

export type GenerateParams = {
  persona: Persona;
  questionText: string;
  variantA: string;
  variantB: string;
  model?: string;
  temperature?: number; // default 0.3
  seed?: number;        // may be ignored by provider
  enableRawOutput?: boolean;
};

export async function generateSingleResponse(params: GenerateParams): Promise<LLMResponse> {
  const {
    persona,
    questionText,
    variantA,
    variantB,
    model = process.env.MODEL_NAME || "gpt-4o-mini",
    temperature = 0.3,
    enableRawOutput = process.env.ENABLE_RAW_OUTPUT === "true",
  } = params;

  const systemPrompt = `You are a single synthetic consumer persona. Always respond as this persona. Stay concise. Persona:\n${personaToText(persona)}`;

  const userPrompt = [
    "You will be given a product description and two feature variants (A and B).",
    "Task: Choose which variant you prefer (A or B) and provide a ONE-SENTENCE rationale.",
    "Output STRICT JSON only, with these keys: preference (\"A\" or \"B\"), rationale (string), confidence (number 0..1).",
    "",
    `Product / Question:\n${questionText}`,
    `Variant A:\n${variantA}`,
    `Variant B:\n${variantB}`,
    "",
    "Rules:",
    "- Output JSON only; no extra words.",
    "- preference must be exactly \"A\" or \"B\".",
    "- confidence is a number between 0 and 1.",
  ].join("\n");

  const client = await getClient();

  const completion = await client.chat.completions.create({
    model,
    temperature,
    // Enforce JSON output shape
    response_format: { type: "json_object" } as any,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = completion.choices?.[0]?.message?.content || "{}";
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}$/);
    parsed = match ? JSON.parse(match[0]) : {};
  }

  const prefRaw = String(parsed.preference || "").trim().toUpperCase();
  const preference: "A" | "B" = prefRaw === "A" ? "A" : prefRaw === "B" ? "B" : "A";
  const rationale = String(parsed.rationale || "").trim().slice(0, 1000);
  const confidence = clamp(Number(parsed.confidence ?? 0.5), 0, 1);

  const resp: LLMResponse = { preference, rationale, confidence };
  if (enableRawOutput) resp.raw = content;
  return resp;
}

export type BatchParams = GenerateParams & { sampleSize: number; concurrency?: number; retries?: number };

export async function batchGenerateResponses(params: BatchParams): Promise<LLMResponse[]> {
  const { sampleSize, concurrency = 5, retries = 2, ...single } = params;

  const results: LLMResponse[] = [];
  let inFlight = 0;
  const queue: Promise<void>[] = [];

  async function runOne(attempt = 0): Promise<void> {
    inFlight++;
    try {
      const r = await generateSingleResponse(single);
      results.push(r);
    } catch (e) {
      if (attempt < retries) {
        await new Promise(res => setTimeout(res, 300 * (attempt + 1)));
        await runOne(attempt + 1);
      } else {
        results.push({ preference: "A", rationale: "Fallback due to error", confidence: 0.5 });
      }
    } finally {
      inFlight--;
    }
  }

  for (let i = 0; i < sampleSize; i++) {
    const start = async () => {
      while (inFlight >= concurrency) {
        await new Promise(res => setTimeout(res, 10));
      }
      await runOne();
    };
    queue.push(start());
  }

  await Promise.all(queue);
  return results;
}