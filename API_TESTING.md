# API Testing Guide

Base URL: `https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod`

## Quick Tests

### 1. Sanity Check Endpoints

```bash
# Test database connection
curl -X GET https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod/test-db

# Test OpenAI connection
curl -X GET https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod/test-openai

# Test basic endpoint
curl -X GET https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod/hello
```

### 2. Agent Tests Endpoints

#### Suggest Tasks

```bash
# Suggest tasks for a URL
curl -X POST https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod/api/agent-tests/suggest-tasks \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

Response:
```json
{
  "runId": "uuid-here",
  "url": "https://example.com",
  "tasks": [
    {
      "id": "task-uuid-1",
      "type": "pricing_page",
      "description": "Find and open the pricing page."
    },
    {
      "id": "task-uuid-2",
      "type": "newsletter_subscribe",
      "description": "Subscribe to the newsletter with a test email."
    },
    {
      "id": "task-uuid-3",
      "type": "refund_policy",
      "description": "Locate and open the refund/returns policy page."
    }
  ]
}
```

#### Run Tests

```bash
# Run agent tests (use runId from suggest-tasks response)
curl -X POST https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod/api/agent-tests/run \
  -H "Content-Type: application/json" \
  -d '{"runId": "your-run-id-here", "url": "https://example.com"}'
```

Response:
```json
{
  "runId": "uuid-here",
  "overallScore": 67,
  "tasks": [
    {
      "id": "task-uuid-1",
      "type": "pricing_page",
      "description": "Find and open the pricing page.",
      "success": true,
      "errorReason": null,
      "videoUrl": null,
      "details": {
        "steps": ["Stubbed runner – no real browser yet."]
      }
    },
    ...
  ]
}
```

### 3. Test Error Handling

```bash
# Test missing URL
curl -X POST https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod/api/agent-tests/suggest-tasks \
  -H "Content-Type: application/json" \
  -d '{}'

# Test missing runId
curl -X POST https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod/api/agent-tests/run \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Test invalid runId
curl -X POST https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod/api/agent-tests/run \
  -H "Content-Type: application/json" \
  -d '{"runId": "invalid-uuid", "url": "https://example.com"}'
```

## Expected Error Response Format

When an error occurs, you'll get:

```json
{
  "error": "Error message here",
  "message": "Detailed error message"
}
```

## Database Verification

After running suggest-tasks, you can verify data was persisted:

```sql
-- Check the latest run
SELECT * FROM agent_test_runs ORDER BY created_at DESC LIMIT 1;

-- Check tasks for that run
SELECT * FROM agent_test_tasks WHERE run_id = '<run-id-from-above>';
```
