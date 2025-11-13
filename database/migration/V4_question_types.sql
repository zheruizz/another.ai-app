-- Add question type and Likert meta to survey_questions
ALTER TABLE survey_questions
  ADD COLUMN question_type VARCHAR(16) DEFAULT 'ab', -- 'ab' | 'likert'
  ADD COLUMN scale_min INT,
  ADD COLUMN scale_max INT;

-- Store question_id for responses (enables per-question analytics)
ALTER TABLE survey_responses
  ADD COLUMN question_id INT REFERENCES survey_questions(id) ON DELETE CASCADE;

-- Add per-question fields to survey_results (so results are per persona per question)
ALTER TABLE survey_results
  ADD COLUMN question_id INT REFERENCES survey_questions(id) ON DELETE CASCADE,
  ADD COLUMN total_samples INT,
  ADD COLUMN count_a INT,
  ADD COLUMN count_b INT;