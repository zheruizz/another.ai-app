import { handler } from "./routes/agent-tests/routes";

async function main() {
  const eventSuggest = {
    path: "/api/agent-tests/suggest-tasks",
    httpMethod: "POST",
    body: JSON.stringify({ url: "https://example.com" }),
  };

  const res1 = await handler(eventSuggest);
  console.log("Suggest response:", res1);

  const parsed = JSON.parse(res1.body);
  const eventRun = {
    path: "/api/agent-tests/run",
    httpMethod: "POST",
    body: JSON.stringify({
      runId: parsed.runId,
      url: parsed.url,
      tasks: parsed.tasks,
    }),
  };

  const res2 = await handler(eventRun);
  console.log("Run response:", res2);
}

main().catch(console.error);
