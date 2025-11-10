import { APIGatewayProxyEventV2 } from "aws-lambda";
import {
  createProject,
  getProjects,
  getProject,
  deleteProject,
} from "../../controllers/projects.controller";

export const handler = async (event: any /* want to support v1 & v2 */) => {
  // Fallback: support both event structures defensively
  let method: string | undefined;
  let path: string | undefined;

  if (event.requestContext && event.requestContext.http && event.requestContext.http.method) {
    method = event.requestContext.http.method;
    path = event.rawPath;
  } else if (event.httpMethod && event.path) {
    method = event.httpMethod;
    path = event.path;
  }

  if (method === "POST" && path?.endsWith("/api/projects")) {
    return await createProject(event);
  }
  if (method === "GET" && path?.endsWith("/api/projects")) {
    return await getProjects(event);
  }
  if (method === "GET" && /\/api\/projects\/\d+$/.test(path ?? "")) {
    return await getProject(event);
  }
  if (method === "DELETE" && /\/api\/projects\/\d+$/.test(path ?? "")) {
    return await deleteProject(event);
  }
  return {
    statusCode: 404,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Not found" }),
  };
};