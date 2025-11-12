-- This migration creates the initial tables for the database

CREATE TABLE personas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    description TEXT,
    avatar_url TEXT,
    traits JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE surveys (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE survey_questions (
    id SERIAL PRIMARY KEY,
    survey_id INT REFERENCES surveys(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL, -- Product description or question
    variant_a TEXT, -- Variant A description (optional image link)
    variant_b TEXT, -- Variant B description (optional image link)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE survey_responses (
    id SERIAL PRIMARY KEY,
    survey_id INT REFERENCES surveys(id) ON DELETE CASCADE,
    persona_id INT REFERENCES personas(id) ON DELETE CASCADE,
    variant_preference VARCHAR(1), -- 'A' or 'B'
    rationale TEXT, -- Rationale snippet
    confidence_score FLOAT, -- Confidence level for the response
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE survey_results (
    id SERIAL PRIMARY KEY,
    survey_id INT REFERENCES surveys(id) ON DELETE CASCADE,
    persona_id INT REFERENCES personas(id) ON DELETE CASCADE,
    variant_a_preference FLOAT, -- % preference for Variant A
    variant_b_preference FLOAT, -- % preference for Variant B
    confidence_interval FLOAT, -- Confidence interval for the result
    rationale_clusters JSONB, -- Grouped rationale snippets
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE survey_logs (
    id SERIAL PRIMARY KEY,
    survey_id INT REFERENCES surveys(id) ON DELETE CASCADE,
    seed INT,
    temperature FLOAT,
    variance FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add survey_runs table
CREATE TABLE survey_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id INT REFERENCES surveys(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending/running/succeeded/failed
  sample_size INT DEFAULT 20,
  persona_ids INT[] DEFAULT NULL,
  model VARCHAR(255),
  temperature FLOAT,
  seed INT,
  estimated_cost FLOAT,
  actual_cost FLOAT,
  enable_raw_output BOOLEAN DEFAULT FALSE,
  notes JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  finished_at TIMESTAMP
);

ALTER TABLE survey_responses
  ADD COLUMN run_id UUID REFERENCES survey_runs(id) ON DELETE SET NULL,
  ADD COLUMN response_index INT,
  ADD COLUMN raw_output TEXT; -- optional: store raw JSON/text from LLM

ALTER TABLE survey_results
  ADD COLUMN run_id UUID REFERENCES survey_runs(id) ON DELETE SET NULL;