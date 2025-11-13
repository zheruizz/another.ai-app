# API Testing Guide

Base URL: `https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod`

## Quick Tests

### 1. Sanity Check Endpoints (Most Important)

```bash
# Test database connection
curl -X GET https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod/test-db

# Test OpenAI connection
curl -X GET https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod/test-openai

# Test basic endpoint
curl -X GET https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod/hello
```

### 2. List Available Data

```bash
# Get all personas
curl -X GET https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod/api/personas

# Get all projects
curl -X GET https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod/api/projects

# Get specific persona
curl -X GET https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod/api/personas/1
```

### 3. Create and Run a Simple Survey

```bash
# Step 1: Create a project
curl -X POST https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod/api/projects \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "name": "Test Project", "description": "Testing"}'

# Note the project ID from response, e.g., {"project":{"id":5,...}}

# Step 2: Create a survey
curl -X POST https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod/api/surveys \
  -H "Content-Type: application/json" \
  -d '{"project_id": 5, "name": "Color Preference Survey"}'

# Note the survey ID from response

# Step 3: Add a question
curl -X POST https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod/api/surveys/1/questions \
  -H "Content-Type: application/json" \
  -d '{"question_text": "Which color do you prefer?", "variant_a": "Blue", "variant_b": "Red"}'

# Step 4: Run the survey (USES OPENAI - COSTS MONEY)
curl -X POST https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod/api/surveys/1/run \
  -H "Content-Type: application/json" \
  -d '{"persona_ids": [1, 2], "sample_size": 3}'

# Step 5: Get results
curl -X GET https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod/api/surveys/1/results
```

### 4. Test Error Handling

```bash
# Test missing persona_ids (should return 400 with details)
curl -X POST https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod/api/surveys/1/run \
  -H "Content-Type: application/json" \
  -d '{"sample_size": 5}'

# Test empty persona array (should return detailed error)
curl -X POST https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod/api/surveys/1/run \
  -H "Content-Type: application/json" \
  -d '{"persona_ids": [], "sample_size": 5}'

# Test non-existent survey (should return detailed error)
curl -X POST https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod/api/surveys/999999/run \
  -H "Content-Type: application/json" \
  -d '{"persona_ids": [1], "sample_size": 5}'
```

## Expected Error Response Format (NEW)

When an error occurs in `/api/surveys/{id}/run`, you'll now get:

```json
{
  "success": false,
  "error": "OpenAI API quota or rate limit exceeded",
  "details": {
    "message": "429 You exceeded your current quota...",
    "errorType": "OPENAI_QUOTA_EXCEEDED",
    "suggestion": "Check your OpenAI API billing and usage limits",
    "surveyId": 1,
    "personaCount": 2,
    "requestedSampleSize": 20
  }
}
```

## Error Types to Test

1. **OPENAI_QUOTA_EXCEEDED** (429) - OpenAI quota limit
2. **OPENAI_AUTH_ERROR** (500) - Invalid API key
3. **TIMEOUT** (504) - Request took too long
4. **VALIDATION_ERROR** (400) - Missing or invalid input
5. **DATABASE_ERROR** (500) - Database connection issues

## Cost Considerations

- `/test-openai`: ~$0.0001 per call (very cheap)
- `/api/surveys/{id}/run`: Depends on:
  - Number of personas
  - Number of questions in survey
  - Sample size
  - Formula: `personas × questions × sample_size` OpenAI calls
  - Example: 2 personas × 1 question × 3 samples = 6 API calls (~$0.001)

## Automated Test Script

Run all tests automatically:

```bash
cd /h/u8/c2/01/zha12739/csc491/another.ai-app
./test-endpoints.sh
```

This script will:
- Test all endpoints
- Create temporary test data
- Clean up after itself
- Show pass/fail summary
