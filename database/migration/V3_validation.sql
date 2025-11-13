CREATE TABLE IF NOT EXISTS human_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id INT REFERENCES surveys(id) ON DELETE CASCADE,
  synthetic_run_id UUID REFERENCES survey_runs(id) ON DELETE SET NULL,
  provider VARCHAR(64), -- e.g., 'prolific'
  status VARCHAR(20) DEFAULT 'pending', -- pending/running/succeeded/failed
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  finished_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS human_responses (
  id SERIAL PRIMARY KEY,
  human_run_id UUID REFERENCES human_runs(id) ON DELETE CASCADE,
  persona_label TEXT, -- if collecting demographics instead of persona id
  question_id INT,    -- survey_questions.id or survey_wtp_questions.id (nullable depending on type)
  response_json JSONB, -- e.g., { choice: "A", rationale: "...", confidence: 0.7 } or { price_point: 75, buy: true }
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alignment_metrics (
  id SERIAL PRIMARY KEY,
  survey_id INT REFERENCES surveys(id) ON DELETE CASCADE,
  synthetic_run_id UUID REFERENCES survey_runs(id) ON DELETE SET NULL,
  human_run_id UUID REFERENCES human_runs(id) ON DELETE SET NULL,
  metric_type VARCHAR(64), -- 'feature_ab_rank_corr', 'wtp_corr', 'wtp_gap'
  metric_value FLOAT,
  details JSONB, -- breakdown per persona/question/price point
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);