"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSurvey = createSurvey;
exports.getSurveys = getSurveys;
exports.addQuestion = addQuestion;
exports.runSurvey = runSurvey;
exports.getSurveyResults = getSurveyResults;
exports.deleteSurvey = deleteSurvey;
const db_1 = __importDefault(require("../utils/db"));
const llm_service_1 = require("./llm.service");
async function createSurvey(projectId, name) {
    const query = `
    INSERT INTO surveys (project_id, name)
    VALUES ($1, $2)
    RETURNING *;
  `;
    const values = [projectId, name];
    const result = await db_1.default.query(query, values);
    return result.rows[0];
}
async function getSurveys(projectId) {
    const query = projectId
        ? `SELECT * FROM surveys WHERE project_id = $1;`
        : `SELECT * FROM surveys;`;
    const values = projectId ? [projectId] : [];
    const result = await db_1.default.query(query, values);
    return result.rows;
}
async function addQuestion(surveyId, questionText, variantA, variantB) {
    const query = `
    INSERT INTO survey_questions (survey_id, question_text, variant_a, variant_b)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
    const values = [surveyId, questionText, variantA, variantB];
    const result = await db_1.default.query(query, values);
    return result.rows[0];
}
function wilsonHalfWidth(n, p, z = 1.96) {
    if (n === 0)
        return 0;
    const denom = 1 + (z * z) / n;
    const center = (p + (z * z) / (2 * n)) / denom;
    const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
    return half;
}
// Loosened return type to keep unit tests (which mock a different shape) compiling
async function runSurvey(surveyId, personaIds, sampleSizeInput) {
    if (!Array.isArray(personaIds) || personaIds.length === 0) {
        throw new Error("persona_ids is required and must be non-empty");
    }
    const maxSample = Number(process.env.MAX_SAMPLE_SIZE || 50);
    const defaultSample = Number(process.env.DEFAULT_SAMPLE_SIZE || 20);
    const sampleSize = Math.min(Math.max(1, Number(sampleSizeInput || defaultSample)), maxSample);
    const model = process.env.MODEL_NAME || "gpt-4o-mini";
    const temperature = 0.3;
    const enableRaw = process.env.ENABLE_RAW_OUTPUT === "true";
    // Create a run record
    const runInsert = await db_1.default.query(`INSERT INTO survey_runs (survey_id, status, sample_size, persona_ids, model, temperature, seed, enable_raw_output, created_at, started_at)
     VALUES ($1, 'running', $2, $3, $4, $5, floor(random()*1000000000)::int, $6, now(), now())
     RETURNING id;`, [surveyId, sampleSize, personaIds, model, temperature, enableRaw]);
    const runId = runInsert.rows[0].id;
    // Load questions
    const qRes = await db_1.default.query(`SELECT id, survey_id, question_text, variant_a, variant_b FROM survey_questions WHERE survey_id = $1 ORDER BY id`, [surveyId]);
    const questions = qRes.rows;
    if (questions.length === 0) {
        throw new Error("No questions found for survey");
    }
    // Load personas
    const pRes = await db_1.default.query(`SELECT * FROM personas WHERE id = ANY($1::int[])`, [personaIds]);
    const personas = pRes.rows;
    if (personas.length !== personaIds.length) {
        // proceed but warn (optionally log)
    }
    const aggByPersona = new Map();
    for (const persona of personas) {
        const personaAgg = { personaId: persona.id, total: 0, aCount: 0, bCount: 0, rationales: [] };
        aggByPersona.set(persona.id, personaAgg);
        for (const q of questions) {
            const batch = await (0, llm_service_1.batchGenerateResponses)({
                persona,
                questionText: q.question_text,
                variantA: q.variant_a || "",
                variantB: q.variant_b || "",
                model,
                temperature,
                enableRawOutput: enableRaw,
                sampleSize,
                concurrency: 5,
                retries: 2,
            });
            let idx = 0;
            for (const r of batch) {
                idx++;
                personaAgg.total += 1;
                if (r.preference === "A")
                    personaAgg.aCount += 1;
                else
                    personaAgg.bCount += 1;
                if (r.rationale)
                    personaAgg.rationales.push(r.rationale);
                await db_1.default.query(`INSERT INTO survey_responses
            (survey_id, persona_id, variant_preference, rationale, confidence_score, run_id, response_index, created_at, raw_output)
           VALUES ($1, $2, $3, $4, $5, $6, $7, now(), $8)`, [
                    surveyId,
                    persona.id,
                    r.preference,
                    r.rationale,
                    r.confidence,
                    runId,
                    idx,
                    enableRaw ? r.raw || null : null,
                ]);
            }
        }
    }
    // Aggregate into survey_results
    const resultsOut = [];
    for (const persona of personas) {
        const agg = aggByPersona.get(persona.id);
        const n = agg.total;
        const pA = n > 0 ? agg.aCount / n : 0;
        const pB = 1 - pA;
        const halfWidth = wilsonHalfWidth(n, Math.max(pA, pB), 1.96);
        // naive rationale clustering: top frequent rationales
        const freq = new Map();
        for (const r of agg.rationales) {
            const key = r.trim().toLowerCase();
            if (!key)
                continue;
            freq.set(key, (freq.get(key) || 0) + 1);
        }
        const clusters = Array.from(freq.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([text, count]) => ({ text, count }));
        const insertRes = await db_1.default.query(`INSERT INTO survey_results
         (survey_id, persona_id, variant_a_preference, variant_b_preference, confidence_interval, rationale_clusters, created_at, run_id)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, now(), $7)
       RETURNING *;`, [surveyId, persona.id, pA, pB, halfWidth, JSON.stringify(clusters), runId]);
        resultsOut.push(insertRes.rows[0]);
    }
    // Finalize run
    await db_1.default.query(`UPDATE survey_runs SET status = 'succeeded', finished_at = now() WHERE id = $1`, [runId]);
    return {
        message: "Survey run completed",
        run_id: runId,
        results: resultsOut,
    };
}
async function getSurveyResults(surveyId) {
    const query = `
    SELECT * FROM survey_results WHERE survey_id = $1;
  `;
    const values = [surveyId];
    const result = await db_1.default.query(query, values);
    return result.rows;
}
async function deleteSurvey(surveyId) {
    const query = `DELETE FROM surveys WHERE id = $1;`;
    const values = [surveyId];
    await db_1.default.query(query, values);
}
