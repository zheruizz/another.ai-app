import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import {
  createProject,
  getProjects,
  getProject,
  deleteProject
} from "../controllers/projects.controller";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResult> => {
  const method = event.requestContext.http.method;
  const path = event.rawPath;

  // Create project: POST /api/projects
  if (method === "POST" && path.endsWith("/api/projects")) {
    return await createProject(event);
  }

  // List projects: GET /api/projects
  if (method === "GET" && path.endsWith("/api/projects")) {
    return await getProjects(event);
  }

  // Get project: GET /api/projects/{projectId}
  if (method === "GET" && /\/api\/projects\/\d+$/.test(path)) {
    return await getProject(event);
  }

  // Delete project: DELETE /api/projects/{projectId}
  if (method === "DELETE" && /\/api\/projects\/\d+$/.test(path)) {
    return await deleteProject(event);
  }

  return {
    statusCode: 404,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Not found" }),
  };
};