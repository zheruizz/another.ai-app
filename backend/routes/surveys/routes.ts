import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import {
  createSurvey,
  getSurveys,
  addQuestion,
  runSurvey,
  getSurveyResults,
  deleteSurvey
} from "../../controllers/surveys.controller";

// The router function dispatches API Gateway events to the correct controller
export const handler = async (
  event: any // Support v1 and v2 events
): Promise<APIGatewayProxyResult> => {
  let method: string | undefined;
  let path: string | undefined;

  if (event.requestContext && event.requestContext.http && event.requestContext.http.method) {
    method = event.requestContext.http.method;
    path = event.rawPath;
  } else if (event.httpMethod && event.path) {
    method = event.httpMethod;
    path = event.path;
  }

  // Create survey: POST /api/surveys
  if (method === "POST" && path?.endsWith("/api/surveys")) {
    return await createSurvey(event);
  }

  // List surveys for project: GET /api/projects/{projectId}/surveys
  if (
    method === "GET" &&
    /\/api\/projects\/\d+\/surveys$/.test(path ?? "")
  ) {
    return await getSurveys(event);
  }

  // Add question: POST /api/surveys/{surveyId}/questions
  if (
    method === "POST" &&
    /\/api\/surveys\/\d+\/questions$/.test(path ?? "")
  ) {
    return await addQuestion(event);
  }

  // Run survey: POST /api/surveys/{surveyId}/run
  if (
    method === "POST" &&
    /\/api\/surveys\/\d+\/run$/.test(path ?? "")
  ) {
    return await runSurvey(event);
  }

  // Get survey results: GET /api/surveys/{surveyId}/results
  if (
    method === "GET" &&
    /\/api\/surveys\/\d+\/results$/.test(path ?? "")
  ) {
    return await getSurveyResults(event);
  }

  // Delete survey: DELETE /api/surveys/{surveyId}
  if (
    method === "DELETE" &&
    /\/api\/surveys\/\d+$/.test(path ?? "")
  ) {
    return await deleteSurvey(event);
  }

  // Default: Not found
  return {
    statusCode: 404,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Not found" }),
  };
};