import { APIGatewayProxyResult } from 'aws-lambda';
import {
  RunAgentTestsRequest,
  RunAgentTestsResponse,
  AgentTestTask,
} from '../types/agentTests';
import * as AgentTestsService from '../services/agentTests.service';

export const runTestsHandler = async (event: any): Promise<APIGatewayProxyResult> => {
  const body: RunAgentTestsRequest = JSON.parse(event.body ?? '{}');

  if (!body.runId || !body.url) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing runId or url' }),
    };
  }

  try {
    // Load tasks from database (ignore body.tasks for now)
    let tasks: AgentTestTask[] = await AgentTestsService.getAgentTestTasksByRunId(body.runId);

    if (tasks.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No tasks found for this runId' }),
      };
    }

    // Stub: apply mock success/failure (still no real Playwright yet)
    const updatedTasks: AgentTestTask[] = await Promise.all(
      tasks.map(async (t, idx) => {
        const success = idx !== 1; // arbitrarily fail the second one
        const errorReason = idx === 1 ? 'Stub: failed for demo purposes.' : null;
        const details = { steps: ['Stubbed runner – no real browser yet.'] };

        // Update task in database
        try {
          await AgentTestsService.updateAgentTestTask(t.id, {
            success,
            errorReason,
            videoUrl: null,
            details,
          });
        } catch (err) {
          console.error(`Failed to update task ${t.id}:`, err);
        }

        return {
          ...t,
          success,
          errorReason,
          videoUrl: null,
          details,
        };
      })
    );

    const successCount = updatedTasks.filter(t => t.success).length;
    const overallScore = Math.round((successCount / updatedTasks.length) * 100);

    const response: RunAgentTestsResponse = {
      runId: body.runId,
      overallScore,
      tasks: updatedTasks,
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to run agent tests',
        message: error.message || String(error),
      }),
    };
  }
};

