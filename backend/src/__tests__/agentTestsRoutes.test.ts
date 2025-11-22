import { handler } from "../routes/agent-tests/routes";
import type { AgentTestTask } from "../types/agentTests";

describe("agent-tests router", () => {
  const suggestPath = "/api/agent-tests/suggest-tasks";
  const runPath = "/api/agent-tests/run";

  it("POST /suggest-tasks with url returns runId and 3 tasks", async () => {
    const res = await handler({
      path: suggestPath,
      httpMethod: "POST",
      body: JSON.stringify({ url: "https://example.com" }),
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.runId).toBeTruthy();
    expect(body.url).toBe("https://example.com");
    expect(body.tasks).toHaveLength(3);
    expect(
  body.tasks.every((t: AgentTestTask) => t.id && t.type && t.description)
).toBe(true);
  });

  it("POST /run returns overallScore and tasks with success flags", async () => {
    const suggestRes = await handler({
      path: suggestPath,
      httpMethod: "POST",
      body: JSON.stringify({ url: "https://example.com" }),
    });
    const suggested = JSON.parse(suggestRes.body);

    const runRes = await handler({
      path: runPath,
      httpMethod: "POST",
      body: JSON.stringify({
        runId: suggested.runId,
        url: suggested.url,
        tasks: suggested.tasks,
      }),
    });

    expect(runRes.statusCode).toBe(200);
    const runBody = JSON.parse(runRes.body);
    expect(runBody.runId).toBe(suggested.runId);
    expect(runBody.tasks).toHaveLength(suggested.tasks.length);
    expect(runBody.overallScore).toBeGreaterThanOrEqual(0);
    expect(runBody.tasks[0].success).toBe(true);
    expect(runBody.tasks[1].success).toBe(false);
    expect(runBody.tasks[2].success).toBe(true);
  });

  it("POST /suggest-tasks without url returns 400", async () => {
    const res = await handler({
      path: suggestPath,
      httpMethod: "POST",
      body: JSON.stringify({}),
    });

    expect(res.statusCode).toBe(400);
  });
}); 
