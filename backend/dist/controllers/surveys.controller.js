"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSurvey = createSurvey;
exports.getSurveys = getSurveys;
exports.addQuestion = addQuestion;
exports.runSurvey = runSurvey;
exports.getSurveyResults = getSurveyResults;
exports.deleteSurvey = deleteSurvey;
const SurveyService = __importStar(require("../services/surveys.service"));
async function createSurvey(event) {
    const { project_id, name } = JSON.parse(event.body || "{}");
    try {
        const survey = await SurveyService.createSurvey(project_id, name);
        return {
            statusCode: 201,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Survey created successfully", survey }),
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Failed to create survey" }),
        };
    }
}
async function getSurveys(event) {
    const match = event.rawPath.match(/\/api\/projects\/(\d+)\/surveys$/);
    const projectId = match ? Number(match[1]) : undefined;
    try {
        const surveys = await SurveyService.getSurveys(projectId);
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(surveys),
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Failed to fetch surveys" }),
        };
    }
}
async function addQuestion(event) {
    const match = event.rawPath.match(/\/api\/surveys\/(\d+)\/questions$/);
    const surveyId = match ? Number(match[1]) : undefined;
    const { question_text, variant_a, variant_b } = JSON.parse(event.body || "{}");
    if (typeof surveyId !== "number") {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Invalid survey ID" }),
        };
    }
    try {
        const question = await SurveyService.addQuestion(surveyId, question_text, variant_a, variant_b);
        return {
            statusCode: 201,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Question added successfully", question }),
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Failed to add question" }),
        };
    }
}
async function runSurvey(event) {
    const match = event.rawPath.match(/\/api\/surveys\/(\d+)\/run$/);
    const surveyId = match ? Number(match[1]) : undefined;
    const { persona_ids } = JSON.parse(event.body || "{}");
    if (typeof surveyId !== "number") {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Invalid survey ID" }),
        };
    }
    try {
        const result = await SurveyService.runSurvey(surveyId, persona_ids);
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result),
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Failed to run survey" }),
        };
    }
}
async function getSurveyResults(event) {
    const match = event.rawPath.match(/\/api\/surveys\/(\d+)\/results$/);
    const surveyId = match ? Number(match[1]) : undefined;
    if (typeof surveyId !== "number") {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Invalid survey ID" }),
        };
    }
    try {
        const results = await SurveyService.getSurveyResults(surveyId);
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(results),
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Failed to fetch survey results" }),
        };
    }
}
async function deleteSurvey(event) {
    const match = event.rawPath.match(/\/api\/surveys\/(\d+)$/);
    const surveyId = match ? Number(match[1]) : undefined;
    if (typeof surveyId !== "number") {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Invalid survey ID" }),
        };
    }
    try {
        await SurveyService.deleteSurvey(surveyId);
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Survey deleted successfully" }),
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Failed to delete survey" }),
        };
    }
}
