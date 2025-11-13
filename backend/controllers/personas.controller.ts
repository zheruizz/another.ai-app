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
  event: any // Support both v1 and v2 events
): Promise<APIGatewayProxyResult> {
  // Support both API Gateway v1 and v2 event formats
  const path = event.rawPath || event.path;
  
  const match = path?.match(/\/api\/personas\/(\d+)$/);
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
    
    if (!persona) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Persona not found" }),
      };
    }
    
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(persona),
    };
  } catch (error: any) {
    // Check if it's a "not found" error
    if (error.message && error.message.includes("not found")) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          error: "Persona not found",
          message: error.message
        }),
      };
    }
    
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        error: "Failed to fetch persona",
        message: error.message || String(error)
      }),
    };
  }
}