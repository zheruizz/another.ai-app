import { APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuid } from 'uuid';
import {
  SuggestTasksRequest,
  SuggestTasksResponse,
  AgentTestTask,
} from '../types/agentTests';

export const suggestTasksHandler = async (event: any): Promise<APIGatewayProxyResult> => {
  const body: SuggestTasksRequest = JSON.parse(event.body ?? '{}');

  if (!body.url) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing url' }),
    };
  }

  const runId = uuid();
  const tasks: AgentTestTask[] = [
    {
      id: uuid(),
      type: 'pricing_page',
      description: 'Find and open the pricing page.',
    },
    {
      id: uuid(),
      type: 'newsletter_subscribe',
      description: 'Subscribe to the newsletter with a test email.',
    },
    {
      id: uuid(),
      type: 'refund_policy',
      description: 'Locate and open the refund/returns policy page.',
    },
  ];

  const response: SuggestTasksResponse = {
    runId,
    url: body.url,
    tasks,
  };

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(response),
  };
};

