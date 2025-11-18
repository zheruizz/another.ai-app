import db from '../../utils/db';
import { AgentTestTask } from '../types/agentTests';

export async function createAgentTestRun(url: string): Promise<string> {
  const result = await db.query(
    'INSERT INTO agent_test_runs (id, url) VALUES (gen_random_uuid(), $1) RETURNING id',
    [url]
  );
  return result.rows[0].id;
}

export async function insertAgentTestTasks(runId: string, tasks: AgentTestTask[]): Promise<void> {
  if (tasks.length === 0) return;

  const values: any[] = [];
  const placeholders: string[] = [];

  tasks.forEach((t, i) => {
    const base = i * 5;
    placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
    values.push(t.id, runId, t.type, t.description, new Date().toISOString());
  });

  await db.query(
    `INSERT INTO agent_test_tasks (id, run_id, type, description, created_at) VALUES ${placeholders.join(', ')}`,
    values
  );
}

export async function getAgentTestTasksByRunId(runId: string): Promise<AgentTestTask[]> {
  const result = await db.query(
    `SELECT id, type, description, success, error_reason as "errorReason", video_url as "videoUrl", details 
     FROM agent_test_tasks 
     WHERE run_id = $1 
     ORDER BY created_at`,
    [runId]
  );
  return result.rows;
}

export async function updateAgentTestTask(
  taskId: string,
  updates: {
    success?: boolean;
    errorReason?: string | null;
    videoUrl?: string | null;
    details?: { steps: string[] };
  }
): Promise<void> {
  const updatesList: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.success !== undefined) {
    updatesList.push(`success = $${paramIndex++}`);
    values.push(updates.success);
  }
  if (updates.errorReason !== undefined) {
    updatesList.push(`error_reason = $${paramIndex++}`);
    values.push(updates.errorReason);
  }
  if (updates.videoUrl !== undefined) {
    updatesList.push(`video_url = $${paramIndex++}`);
    values.push(updates.videoUrl);
  }
  if (updates.details !== undefined) {
    updatesList.push(`details = $${paramIndex++}::jsonb`);
    values.push(JSON.stringify(updates.details));
  }

  if (updatesList.length === 0) return;

  values.push(taskId);
  await db.query(
    `UPDATE agent_test_tasks SET ${updatesList.join(', ')} WHERE id = $${paramIndex}`,
    values
  );
}

