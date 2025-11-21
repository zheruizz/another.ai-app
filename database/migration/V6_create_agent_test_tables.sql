-- Create agent test tables for storing test runs and tasks

CREATE TABLE agent_test_runs (
  id UUID PRIMARY KEY,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE agent_test_tasks (
  id UUID PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES agent_test_runs(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  success BOOLEAN,
  error_reason TEXT,
  video_url TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

