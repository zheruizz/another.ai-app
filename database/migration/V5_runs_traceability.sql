-- Traceability on runs
ALTER TABLE survey_runs
  ADD COLUMN provider VARCHAR(64) DEFAULT 'openai',
  ADD COLUMN prompt_hash VARCHAR(128),
  ADD COLUMN usage_prompt_tokens INT,
  ADD COLUMN usage_completion_tokens INT,
  ADD COLUMN estimated_cost FLOAT;