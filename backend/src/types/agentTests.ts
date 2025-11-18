export type AgentTaskType = 'pricing_page' | 'newsletter_subscribe' | 'refund_policy';

export interface AgentTestTask {
  id: string;              // uuid
  type: AgentTaskType;
  description: string;
  success?: boolean;
  errorReason?: string | null;
  videoUrl?: string | null;
  details?: { steps: string[] };
}

export interface AgentTestRun {
  id: string;
  url: string;
  createdAt: string;
}

export interface SuggestTasksRequest {
  url: string;
}

export interface SuggestTasksResponse {
  runId: string;
  url: string;
  tasks: AgentTestTask[];
}

export interface RunAgentTestsRequest {
  runId: string;
  url: string;
  tasks: AgentTestTask[];
}

export interface RunAgentTestsResponse {
  runId: string;
  overallScore: number;
  tasks: AgentTestTask[];
}

