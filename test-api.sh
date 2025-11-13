#!/bin/bash

# Set your API base URL from AWS API Gateway
export BASE_URL="https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod"

echo "========================================"
echo "API Testing Script"
echo "========================================"
echo ""

# 1. Health check
echo "1. Testing /hello endpoint..."
curl -sS "$BASE_URL/hello" | jq .
echo ""

# 2. Get Personas
echo "2. Fetching personas..."
PERSONAS_JSON=$(curl -sS "$BASE_URL/api/personas")
echo "$PERSONAS_JSON" | jq .

# Extract first two persona IDs
PERSONA1=$(echo "$PERSONAS_JSON" | jq -r '.[0].id // empty')
PERSONA2=$(echo "$PERSONAS_JSON" | jq -r '.[1].id // empty')

if [ -z "$PERSONA1" ] || [ -z "$PERSONA2" ]; then
  echo "ERROR: Not enough personas found. Need at least 2 personas."
  echo "Please seed the personas table first."
  exit 1
fi

echo "Using PERSONA1=$PERSONA1, PERSONA2=$PERSONA2"
echo ""

# 3. Create a project
echo "3. Creating a project..."
PROJECT_JSON=$(curl -sS -X POST "$BASE_URL/api/projects" \
  -H "Content-Type: application/json" \
  -d '{"user_id": null, "name": "Demo Project", "description": "Test project"}')
echo "$PROJECT_JSON" | jq .

PROJECT_ID=$(echo "$PROJECT_JSON" | jq -r '.project.id // empty')
if [ -z "$PROJECT_ID" ]; then
  echo "ERROR: Failed to create project"
  exit 1
fi
echo "PROJECT_ID=$PROJECT_ID"
echo ""

# 4. Create a survey
echo "4. Creating a survey..."
SURVEY_JSON=$(curl -sS -X POST "$BASE_URL/api/surveys" \
  -H "Content-Type: application/json" \
  -d "{\"project_id\": $PROJECT_ID, \"name\": \"Feature Test\"}")
echo "$SURVEY_JSON" | jq .

SURVEY_ID=$(echo "$SURVEY_JSON" | jq -r '.survey.id // empty')
if [ -z "$SURVEY_ID" ]; then
  echo "ERROR: Failed to create survey"
  exit 1
fi
echo "SURVEY_ID=$SURVEY_ID"
echo ""

# 5. Add a question (A/B)
echo "5. Adding A/B question to survey..."
curl -sS -X POST "$BASE_URL/api/surveys/$SURVEY_ID/questions" \
  -H "Content-Type: application/json" \
  -d '{
    "question_text": "You are evaluating a new water bottle.",
    "variant_a": "Variant A: Insulated, 24oz, screw cap.",
    "variant_b": "Variant B: Lightweight, 20oz, flip-top lid."
  }' | jq .
echo ""

# 6. Run the survey (small sample to validate)
echo "6. Running survey with small sample size..."
echo "This will call OpenAI API and may take a minute..."
curl -sS -X POST "$BASE_URL/api/surveys/$SURVEY_ID/run" \
  -H "Content-Type: application/json" \
  -d "{\"persona_ids\": [$PERSONA1, $PERSONA2], \"sample_size\": 3}" | jq .
echo ""

# 7. Get results
echo "7. Fetching survey results..."
curl -sS "$BASE_URL/api/surveys/$SURVEY_ID/results" | jq .
echo ""

# 8. Optional: List surveys for the project
echo "8. Listing surveys for project..."
curl -sS "$BASE_URL/api/projects/$PROJECT_ID/surveys" | jq .
echo ""

# 9. Optional cleanup
read -p "Do you want to cleanup (delete survey and project)? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "9a. Deleting survey..."
  curl -sS -X DELETE "$BASE_URL/api/surveys/$SURVEY_ID" | jq .
  echo ""
  
  echo "9b. Deleting project..."
  curl -sS -X DELETE "$BASE_URL/api/projects/$PROJECT_ID" | jq .
  echo ""
fi

echo "========================================"
echo "Testing complete!"
echo "========================================"
