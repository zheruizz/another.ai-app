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
async function runSurvey(surveyId, personaIds) {
    // Placeholder: Real implementation would generate synthetic responses and insert into survey_responses
    // For now, just return the inputs
    return { message: "Survey run successfully", surveyId, personaIds };
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
