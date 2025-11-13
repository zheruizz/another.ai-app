import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import * as SurveyService from "../services/surveys.service";

export async function createSurvey(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResult> {
  const { project_id, name } = JSON.parse(event.body || "{}");
  try {
    const survey = await SurveyService.createSurvey(project_id, name);
    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Survey created successfully", survey }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        error: "Failed to create survey",
        message: error.message || String(error)
      }),
    };
  }
}

export async function getSurveys(
  event: any // Support both v1 and v2 events
): Promise<APIGatewayProxyResult> {
  const path = event.rawPath || event.path;
  const match = path?.match(/\/api\/projects\/(\d+)\/surveys$/);
  const projectId = match ? Number(match[1]) : undefined;
  try {
    const surveys = await SurveyService.getSurveys(projectId);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(surveys),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        error: "Failed to fetch surveys",
        message: error.message || String(error)
      }),
    };
  }
}

export async function addQuestion(
  event: any // Support both v1 and v2 events
): Promise<APIGatewayProxyResult> {
  const path = event.rawPath || event.path;
  const match = path?.match(/\/api\/surveys\/(\d+)\/questions$/);
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
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        error: "Failed to add question",
        message: error.message || String(error)
      }),
    };
  }
}

export async function runSurvey(
  event: any // Support both v1 and v2 events
): Promise<APIGatewayProxyResult> {
  const path = event.rawPath || event.path;
  const match = path?.match(/\/api\/surveys\/(\d+)\/run$/);
  const surveyId = match ? Number(match[1]) : undefined;
  const { persona_ids, sample_size } = JSON.parse(event.body || "{}");
  if (typeof surveyId !== "number") {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid survey ID" }),
    };
  }
  try {
    const result = await SurveyService.runSurvey(surveyId, persona_ids, sample_size);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    // Determine status code based on error type
    let statusCode = 500;
    let errorResponse: any = {
      success: false,
      error: "Failed to run survey",
      details: {},
    };

    // Categorize the error
    if (error.message) {
      errorResponse.details.message = error.message;

      // OpenAI quota/rate limit errors
      if (error.message.includes("429") || error.message.includes("quota") || error.message.includes("rate limit")) {
        statusCode = 429;
        errorResponse.error = "OpenAI API quota or rate limit exceeded";
        errorResponse.details.errorType = "OPENAI_QUOTA_EXCEEDED";
        errorResponse.details.suggestion = "Check your OpenAI API billing and usage limits";
      }
      // OpenAI authentication errors
      else if (error.message.includes("401") || error.message.includes("authentication") || error.message.includes("API key")) {
        statusCode = 500;
        errorResponse.error = "OpenAI authentication failed";
        errorResponse.details.errorType = "OPENAI_AUTH_ERROR";
        errorResponse.details.suggestion = "Check OpenAI API key in AWS Secrets Manager";
      }
      // Timeout errors
      else if (error.message.includes("timeout") || error.message.includes("ETIMEDOUT")) {
        statusCode = 504;
        errorResponse.error = "Request timed out";
        errorResponse.details.errorType = "TIMEOUT";
        errorResponse.details.suggestion = "The survey run took too long. Try reducing sample_size or number of personas";
      }
      // Validation errors
      else if (error.message.includes("required") || error.message.includes("must be") || error.message.includes("No questions found")) {
        statusCode = 400;
        errorResponse.error = "Invalid request";
        errorResponse.details.errorType = "VALIDATION_ERROR";
      }
      // Database errors
      else if (error.message.includes("database") || error.message.includes("query") || error.code === "ECONNREFUSED") {
        statusCode = 500;
        errorResponse.error = "Database error";
        errorResponse.details.errorType = "DATABASE_ERROR";
      }
    }

    // Include stack trace in development/debug mode
    if (process.env.ENABLE_ERROR_STACK === "true") {
      errorResponse.details.stack = error.stack;
    }

    // Include survey context
    errorResponse.details.surveyId = surveyId;
    errorResponse.details.personaCount = Array.isArray(persona_ids) ? persona_ids.length : 0;
    errorResponse.details.requestedSampleSize = sample_size;

    return {
      statusCode,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorResponse),
    };
  }
}

export async function getSurveyResults(
  event: any // Support both v1 and v2 events
): Promise<APIGatewayProxyResult> {
  const path = event.rawPath || event.path;
  const match = path?.match(/\/api\/surveys\/(\d+)\/results$/);
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
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        error: "Failed to fetch survey results",
        message: error.message || String(error)
      }),
    };
  }
}

export async function deleteSurvey(
  event: any // Support both v1 and v2 events
): Promise<APIGatewayProxyResult> {
  const path = event.rawPath || event.path;
  const match = path?.match(/\/api\/surveys\/(\d+)$/);
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
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        error: "Failed to delete survey",
        message: error.message || String(error)
      }),
    };
  }
}