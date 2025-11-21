import { APIGatewayProxyResult } from "aws-lambda";
import { suggestTasksHandler } from "../../src/handlers/agentTestsSuggest";
import { runTestsHandler } from "../../src/handlers/agentTestsRun";

export const handler = async (event: any): Promise<APIGatewayProxyResult> => {
  let method: string | undefined;
  let path: string | undefined;

  if (event.requestContext && event.requestContext.http && event.requestContext.http.method) {
    method = event.requestContext.http.method;
    path = event.rawPath;
  } else if (event.httpMethod && event.path) {
    method = event.httpMethod;
    path = event.path;
  }

  // POST /api/agent-tests/suggest-tasks
  if (method === "POST" && path?.endsWith("/api/agent-tests/suggest-tasks")) {
    return await suggestTasksHandler(event);
  }

  // POST /api/agent-tests/run
  if (method === "POST" && path?.endsWith("/api/agent-tests/run")) {
    return await runTestsHandler(event);
  }

  // Default: Not found
  return {
    statusCode: 404,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Not found" }),
  };
};

