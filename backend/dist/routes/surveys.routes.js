"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const surveys_controller_1 = require("../controllers/surveys.controller");
// The router function dispatches API Gateway events to the correct controller
const handler = async (event) => {
    const method = event.requestContext.http.method;
    const path = event.rawPath;
    // Create survey: POST /api/surveys
    if (method === "POST" && path.endsWith("/api/surveys")) {
        return await (0, surveys_controller_1.createSurvey)(event);
    }
    // List surveys for project: GET /api/projects/{projectId}/surveys
    if (method === "GET" &&
        /\/api\/projects\/\d+\/surveys$/.test(path)) {
        return await (0, surveys_controller_1.getSurveys)(event);
    }
    // Add question: POST /api/surveys/{surveyId}/questions
    if (method === "POST" &&
        /\/api\/surveys\/\d+\/questions$/.test(path)) {
        return await (0, surveys_controller_1.addQuestion)(event);
    }
    // Run survey: POST /api/surveys/{surveyId}/run
    if (method === "POST" &&
        /\/api\/surveys\/\d+\/run$/.test(path)) {
        return await (0, surveys_controller_1.runSurvey)(event);
    }
    // Get survey results: GET /api/surveys/{surveyId}/results
    if (method === "GET" &&
        /\/api\/surveys\/\d+\/results$/.test(path)) {
        return await (0, surveys_controller_1.getSurveyResults)(event);
    }
    // Delete survey: DELETE /api/surveys/{surveyId}
    if (method === "DELETE" &&
        /\/api\/surveys\/\d+$/.test(path)) {
        return await (0, surveys_controller_1.deleteSurvey)(event);
    }
    // Default: Not found
    return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Not found" }),
    };
};
exports.handler = handler;
