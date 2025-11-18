import { APIGatewayProxyResult } from 'aws-lambda';
import {
  RunAgentTestsRequest,
  RunAgentTestsResponse,
  AgentTestTask,
} from '../types/agentTests';

export const runTestsHandler = async (event: any): Promise<APIGatewayProxyResult> => {
  const body: RunAgentTestsRequest = JSON.parse(event.body ?? '{}');

  if (!body.runId || !body.url || !body.tasks?.length) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing runId, url, or tasks' }),
    };
  }

  const tasks: AgentTestTask[] = body.tasks.map((t, idx) => ({
    ...t,
    success: idx !== 1, // arbitrarily fail the second one
    errorReason: idx === 1 ? 'Stub: failed for demo purposes.' : null,
    videoUrl: null,
    details: { steps: ['Stubbed runner – no real browser yet.'] },
  }));

  const successCount = tasks.filter(t => t.success).length;
  const overallScore = Math.round((successCount / tasks.length) * 100);

  const response: RunAgentTestsResponse = {
    runId: body.runId,
    overallScore,
    tasks,
  };

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(response),
  };
};

