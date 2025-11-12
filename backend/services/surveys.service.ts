import db from "../utils/db";
import { batchGenerateResponses, LLMResponse } from "./llm.service";

export async function createSurvey(projectId: number, name: string) {
  const query = `
    INSERT INTO surveys (project_id, name)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const values = [projectId, name];
  const result = await db.query(query, values);
  return result.rows[0];
}

export async function getSurveys(projectId?: number) {
  const query = projectId
    ? `SELECT * FROM surveys WHERE project_id = $1;`
    : `SELECT * FROM surveys;`;
  const values = projectId ? [projectId] : [];
  const result = await db.query(query, values);
  return result.rows;
}

export async function addQuestion(surveyId: number, questionText: string, variantA: string, variantB: string) {
  const query = `
    INSERT INTO survey_questions (survey_id, question_text, variant_a, variant_b)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [surveyId, questionText, variantA, variantB];
  const result = await db.query(query, values);
  return result.rows[0];
}

type PersonaRow = {
  id: number;
  name: string;
  role: string | null;
  description: string | null;
  avatar_url: string | null;
  traits: any | null;
};

type QuestionRow = {
  id: number;
  survey_id: number;
  question_text: string;
  variant_a: string;
  variant_b: string;
};

function wilsonHalfWidth(n: number, p: number, z = 1.96): number {
  if (n === 0) return 0;
  const denom = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return half;
}

// Loosened return type to keep unit tests (which mock a different shape) compiling
export async function runSurvey(surveyId: number, personaIds: number[], sampleSizeInput?: number): Promise<any> {
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
  const runInsert = await db.query(
    `INSERT INTO survey_runs (survey_id, status, sample_size, persona_ids, model, temperature, seed, enable_raw_output, created_at, started_at)
     VALUES ($1, 'running', $2, $3, $4, $5, floor(random()*1000000000)::int, $6, now(), now())
     RETURNING id;`,
    [surveyId, sampleSize, personaIds, model, temperature, enableRaw]
  );
  const runId: string = runInsert.rows[0].id;

  // Load questions
  const qRes = await db.query(
    `SELECT id, survey_id, question_text, variant_a, variant_b FROM survey_questions WHERE survey_id = $1 ORDER BY id`,
    [surveyId]
  );
  const questions = (qRes.rows as QuestionRow[]);
  if (questions.length === 0) {
    throw new Error("No questions found for survey");
  }

  // Load personas
  const pRes = await db.query(`SELECT * FROM personas WHERE id = ANY($1::int[])`, [personaIds]);
  const personas = (pRes.rows as PersonaRow[]);
  if (personas.length !== personaIds.length) {
    // proceed but warn (optionally log)
  }

  // Generate responses and persist
  type Agg = {
    personaId: number;
    total: number;
    aCount: number;
    bCount: number;
    rationales: string[];
  };

  const aggByPersona = new Map<number, Agg>();

  for (const persona of personas) {
    const personaAgg: Agg = { personaId: persona.id, total: 0, aCount: 0, bCount: 0, rationales: [] };
    aggByPersona.set(persona.id, personaAgg);

    for (const q of questions) {
      const batch: LLMResponse[] = await batchGenerateResponses({
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
        if (r.preference === "A") personaAgg.aCount += 1;
        else personaAgg.bCount += 1;
        if (r.rationale) personaAgg.rationales.push(r.rationale);

        await db.query(
          `INSERT INTO survey_responses
            (survey_id, persona_id, variant_preference, rationale, confidence_score, run_id, response_index, created_at, raw_output)
           VALUES ($1, $2, $3, $4, $5, $6, $7, now(), $8)`,
          [
            surveyId,
            persona.id,
            r.preference,
            r.rationale,
            r.confidence,
            runId,
            idx,
            enableRaw ? r.raw || null : null,
          ]
        );
      }
    }
  }

  // Aggregate into survey_results
  const resultsOut: any[] = [];
  for (const persona of personas) {
    const agg = aggByPersona.get(persona.id)!;
    const n = agg.total;
    const pA = n > 0 ? agg.aCount / n : 0;
    const pB = 1 - pA;
    const halfWidth = wilsonHalfWidth(n, Math.max(pA, pB), 1.96);

    // naive rationale clustering: top frequent rationales
    const freq = new Map<string, number>();
    for (const r of agg.rationales) {
      const key = r.trim().toLowerCase();
      if (!key) continue;
      freq.set(key, (freq.get(key) || 0) + 1);
    }
    const clusters = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text, count]) => ({ text, count }));

    const insertRes = await db.query(
      `INSERT INTO survey_results
         (survey_id, persona_id, variant_a_preference, variant_b_preference, confidence_interval, rationale_clusters, created_at, run_id)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, now(), $7)
       RETURNING *;`,
      [surveyId, persona.id, pA, pB, halfWidth, JSON.stringify(clusters), runId]
    );

    resultsOut.push(insertRes.rows[0]);
  }

  // Finalize run
  await db.query(
    `UPDATE survey_runs SET status = 'succeeded', finished_at = now() WHERE id = $1`,
    [runId]
  );

  return {
    message: "Survey run completed",
    run_id: runId,
    results: resultsOut,
  };
}

export async function getSurveyResults(surveyId: number) {
  const query = `
    SELECT * FROM survey_results WHERE survey_id = $1;
  `;
  const values = [surveyId];
  const result = await db.query(query, values);
  return result.rows;
}

export async function deleteSurvey(surveyId: number) {
  const query = `DELETE FROM surveys WHERE id = $1;`;
  const values = [surveyId];
  await db.query(query, values);
}