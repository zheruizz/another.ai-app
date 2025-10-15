import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import * as PersonaService from "../services/personas.service";

export async function getPersonas(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResult> {
  try {
    const personas = await PersonaService.getPersonas();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(personas),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to fetch personas" }),
    };
  }
}

export async function getPersona(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResult> {
  const match = event.rawPath.match(/\/api\/personas\/(\d+)$/);
  const personaId = match ? Number(match[1]) : undefined;
  if (typeof personaId !== "number") {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid persona ID" }),
    };
  }
  try {
    const persona = await PersonaService.getPersona(personaId);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(persona),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to fetch persona" }),
    };
  }
}