import db from "../utils/db";

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

export async function runSurvey(surveyId: number, personaIds: number[]) {
  // Placeholder: Real implementation would generate synthetic responses and insert into survey_responses
  // For now, just return the inputs
  return { message: "Survey run successfully", surveyId, personaIds };
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