import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import * as ProjectService from "../services/projects.service";

export async function createProject(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResult> {
  const { user_id, name, description } = JSON.parse(event.body || "{}");
  try {
    const project = await ProjectService.createProject(user_id, name, description);
    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Project created successfully", project }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to create project" }),
    };
  }
}

export async function getProjects(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResult> {
  const user_id = event.queryStringParameters?.user_id;
  try {
    const projects = await ProjectService.getProjects(user_id ? Number(user_id) : undefined);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projects),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to fetch projects" }),
    };
  }
}

export async function getProject(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResult> {
  const match = event.rawPath.match(/\/api\/projects\/(\d+)$/);
  const projectId = match ? Number(match[1]) : undefined;
  if (typeof projectId !== "number") {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid project ID" }),
    };
  }
  try {
    const project = await ProjectService.getProject(projectId);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to fetch project" }),
    };
  }
}

export async function deleteProject(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResult> {
  const match = event.rawPath.match(/\/api\/projects\/(\d+)$/);
  const projectId = match ? Number(match[1]) : undefined;
  if (typeof projectId !== "number") {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid project ID" }),
    };
  }
  try {
    await ProjectService.deleteProject(projectId);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Project deleted successfully" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to delete project" }),
    };
  }
}