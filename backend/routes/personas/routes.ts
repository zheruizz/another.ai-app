import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import {
  getPersonas,
  getPersona
} from "../../controllers/personas.controller";

export const handler = async (
  event: any // Support v1 and v2 events
): Promise<APIGatewayProxyResult> => {
  // Type-flexible extraction for method and path
  let method: string | undefined;
  let path: string | undefined;

  if (event.requestContext && event.requestContext.http && event.requestContext.http.method) {
    method = event.requestContext.http.method;
    path = event.rawPath;
  } else if (event.httpMethod && event.path) {
    method = event.httpMethod;
    path = event.path;
  }

  // List personas: GET /api/personas
  if (method === "GET" && path?.endsWith("/api/personas")) {
    return await getPersonas(event);
  }

  // Get persona: GET /api/personas/{personaId}
  if (method === "GET" && /\/api\/personas\/\d+$/.test(path ?? "")) {
    return await getPersona(event);
  }

  return {
    statusCode: 404,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Not found" }),
  };
};