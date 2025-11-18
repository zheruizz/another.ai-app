"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSingleResponse = generateSingleResponse;
exports.batchGenerateResponses = batchGenerateResponses;
const openai_1 = __importDefault(require("openai"));
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
let cachedApiKey = null;
let cachedClient = null;
async function loadApiKey() {
    if (cachedApiKey)
        return cachedApiKey;
    const secretName = process.env.OPENAI_SECRET_NAME;
    const secretRegion = process.env.OPENAI_REGION;
    // Prefer Secrets Manager if configured
    if (secretName && secretRegion) {
        const sm = new client_secrets_manager_1.SecretsManagerClient({ region: secretRegion });
        const res = await sm.send(new client_secrets_manager_1.GetSecretValueCommand({ SecretId: secretName }));
        const secretString = res.SecretString;
        if (!secretString)
            throw new Error("Secrets Manager returned empty SecretString for OpenAI key");
        const parsed = JSON.parse(secretString);
        if (!parsed.OPENAI_API_KEY)
            throw new Error("Secret missing OPENAI_API_KEY field");
        cachedApiKey = parsed.OPENAI_API_KEY;
        return cachedApiKey;
    }
    // Fallback to environment variable for local dev
    const envKey = process.env.OPENAI_API_KEY;
    if (!envKey)
        throw new Error("OpenAI API key not found (Secrets Manager or OPENAI_API_KEY env)");
    cachedApiKey = envKey;
    return cachedApiKey;
}
async function getClient() {
    if (cachedClient)
        return cachedClient;
    const key = await loadApiKey();
    cachedClient = new openai_1.default({ apiKey: key });
    return cachedClient;
}
function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}
function personaToText(persona) {
    const traits = persona.traits ? JSON.stringify(persona.traits) : "";
    return [
        `Name: ${persona.name}`,
        persona.role ? `Role: ${persona.role}` : "",
        persona.description ? `Description: ${persona.description}` : "",
        traits ? `Traits (JSON): ${traits}` : "",
    ].filter(Boolean).join("\n");
}
async function generateSingleResponse(params) {
    const { persona, questionText, variantA, variantB, model = process.env.MODEL_NAME || "gpt-4o-mini", temperature = 0.3, enableRawOutput = process.env.ENABLE_RAW_OUTPUT === "true", } = params;
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
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
    });
    const content = completion.choices?.[0]?.message?.content || "{}";
    let parsed;
    try {
        parsed = JSON.parse(content);
    }
    catch {
        const match = content.match(/\{[\s\S]*\}$/);
        parsed = match ? JSON.parse(match[0]) : {};
    }
    const prefRaw = String(parsed.preference || "").trim().toUpperCase();
    const preference = prefRaw === "A" ? "A" : prefRaw === "B" ? "B" : "A";
    const rationale = String(parsed.rationale || "").trim().slice(0, 1000);
    const confidence = clamp(Number(parsed.confidence ?? 0.5), 0, 1);
    const resp = { preference, rationale, confidence };
    if (enableRawOutput)
        resp.raw = content;
    return resp;
}
async function batchGenerateResponses(params) {
    const { sampleSize, concurrency = 5, retries = 2, ...single } = params;
    const results = [];
    let inFlight = 0;
    const queue = [];
    async function runOne(attempt = 0) {
        inFlight++;
        try {
            const r = await generateSingleResponse(single);
            results.push(r);
        }
        catch (e) {
            if (attempt < retries) {
                await new Promise(res => setTimeout(res, 300 * (attempt + 1)));
                await runOne(attempt + 1);
            }
            else {
                results.push({ preference: "A", rationale: "Fallback due to error", confidence: 0.5 });
            }
        }
        finally {
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
