-- WTP ladder config per survey (supports multiple configs if you want, but start with one)
CREATE TABLE IF NOT EXISTS survey_wtp_questions (
  id SERIAL PRIMARY KEY,
  survey_id INT REFERENCES surveys(id) ON DELETE CASCADE,
  baseline_text TEXT NOT NULL,
  added_feature_text TEXT,
  price_points JSONB NOT NULL, -- e.g., [50,75,100]
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Aggregated results per price point and persona
CREATE TABLE IF NOT EXISTS survey_wtp_results (
  id SERIAL PRIMARY KEY,
  survey_id INT REFERENCES surveys(id) ON DELETE CASCADE,
  persona_id INT REFERENCES personas(id) ON DELETE CASCADE,
  question_id INT REFERENCES survey_wtp_questions(id) ON DELETE CASCADE,
  run_id UUID REFERENCES survey_runs(id) ON DELETE SET NULL,
  price_point NUMERIC NOT NULL,
  buy_rate FLOAT NOT NULL,
  n INT NOT NULL,
  confidence_interval FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);