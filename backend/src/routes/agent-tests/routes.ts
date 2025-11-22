import { v4 as uuid } from "uuid";
import {
  AgentTestTask,
  SuggestTasksRequest,
  SuggestTasksResponse,
  RunAgentTestsRequest,
  RunAgentTestsResponse,
} from "../../types/agentTests";

export const handler = async (event: any) => {
  const path = event.path || event.rawPath || event.requestContext?.http?.path || "";
  const method = (event.httpMethod || event.requestContext?.http?.method || "GET").toUpperCase();

  if (path.endsWith("/suggest-tasks") && method === "POST") {
    return handleSuggestTasks(event);
  }

  if (path.endsWith("/run") && method === "POST") {
    return handleRun(event);
  }

  return {
    statusCode: 404,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ error: "Not found" }),
  };
};

async function handleSuggestTasks(event: any) {
  const body: SuggestTasksRequest = JSON.parse(event.body ?? "{}");

  if (!body.url) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing url" }),
    };
  }

  const runId = uuid();
  const tasks: AgentTestTask[] = [
    {
      id: uuid(),
      type: "pricing_page",
      description: "Find and open the pricing page.",
    },
    {
      id: uuid(),
      type: "newsletter_subscribe",
      description: "Subscribe to the newsletter with a test email.",
    },
    {
      id: uuid(),
      type: "refund_policy",
      description: "Locate and open the refund/returns policy page.",
    },
  ];

  const response: SuggestTasksResponse = {
    runId,
    url: body.url,
    tasks,
  };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(response),
  };
}

async function handleRun(event: any) {
  const body: RunAgentTestsRequest = JSON.parse(event.body ?? "{}");

  if (!body.runId || !body.url || !body.tasks?.length) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing runId, url, or tasks" }),
    };
  }

  const tasks: AgentTestTask[] = body.tasks.map((t, idx) => ({
    ...t,
    success: idx !== 1,
    errorReason: idx === 1 ? "Stub: failed for demo purposes." : null,
    videoUrl: null,
    details: { steps: ["Stubbed runner - no real browser yet."] },
  }));

  const successCount = tasks.filter((t) => t.success).length;
  const overallScore = Math.round((successCount / tasks.length) * 100);

  const response: RunAgentTestsResponse = {
    runId: body.runId,
    overallScore,
    tasks,
  };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(response),
  };
}

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
};
