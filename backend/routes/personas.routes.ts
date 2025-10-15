import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import {
  getPersonas,
  getPersona
} from "../controllers/personas.controller";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResult> => {
  const method = event.requestContext.http.method;
  const path = event.rawPath;

  // List personas: GET /api/personas
  if (method === "GET" && path.endsWith("/api/personas")) {
    return await getPersonas(event);
  }

  // Get persona: GET /api/personas/{personaId}
  if (method === "GET" && /\/api\/personas\/\d+$/.test(path)) {
    return await getPersona(event);
  }

  return {
    statusCode: 404,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Not found" }),
  };
};