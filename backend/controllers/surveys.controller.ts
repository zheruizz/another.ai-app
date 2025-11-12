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
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to create survey" }),
    };
  }
}

export async function getSurveys(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResult> {
  const match = event.rawPath.match(/\/api\/projects\/(\d+)\/surveys$/);
  const projectId = match ? Number(match[1]) : undefined;
  try {
    const surveys = await SurveyService.getSurveys(projectId);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(surveys),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to fetch surveys" }),
    };
  }
}

export async function addQuestion(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResult> {
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
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to add question" }),
    };
  }
}

export async function runSurvey(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResult> {
  const match = event.rawPath.match(/\/api\/surveys\/(\d+)\/run$/);
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
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to run survey" }),
    };
  }
}

export async function getSurveyResults(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResult> {
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
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to fetch survey results" }),
    };
  }
}

export async function deleteSurvey(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResult> {
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
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to delete survey" }),
    };
  }
}