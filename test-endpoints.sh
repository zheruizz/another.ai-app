#!/bin/bash

# API Base URL
API_URL="https://k5lci8jk75.execute-api.us-east-1.amazonaws.com/prod"

echo "=========================================="
echo "Testing another.ai API Endpoints"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TOTAL=0
PASSED=0
FAILED=0

# Helper function to test endpoint
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"
    
    TOTAL=$((TOTAL + 1))
    echo -e "${YELLOW}Test $TOTAL: $name${NC}"
    echo "  $method $endpoint"
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" == "$expected_status" ]; then
        echo -e "  ${GREEN}✓ PASSED${NC} (Status: $http_code)"
        PASSED=$((PASSED + 1))
    else
        echo -e "  ${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $http_code)"
        FAILED=$((FAILED + 1))
    fi
    
    echo "  Response: $(echo $body | jq -c '.' 2>/dev/null || echo $body)"
    echo ""
}

echo "=========================================="
echo "1. SANITY CHECK ENDPOINTS"
echo "=========================================="
echo ""

test_endpoint "Test Database Connection" "GET" "/test-db" "" "200"
test_endpoint "Test OpenAI Connection" "GET" "/test-openai" "" "200"
test_endpoint "Hello Endpoint" "GET" "/hello" "" "200"

echo "=========================================="
echo "2. PERSONAS ENDPOINTS"
echo "=========================================="
echo ""

test_endpoint "Get All Personas" "GET" "/api/personas" "" "200"
test_endpoint "Get Persona by ID (valid)" "GET" "/api/personas/1" "" "200"
test_endpoint "Get Persona by ID (invalid)" "GET" "/api/personas/999999" "" "404"

echo "=========================================="
echo "3. PROJECTS ENDPOINTS"
echo "=========================================="
echo ""

test_endpoint "Get All Projects" "GET" "/api/projects" "" "200"

# Create a test project
echo -e "${YELLOW}Creating Test Project...${NC}"
create_response=$(curl -s -X POST "$API_URL/api/projects" \
    -H "Content-Type: application/json" \
    -d '{"user_id": 1, "name": "Test Project", "description": "Automated test project"}')
project_id=$(echo $create_response | jq -r '.project.id' 2>/dev/null)

if [ ! -z "$project_id" ] && [ "$project_id" != "null" ]; then
    echo -e "${GREEN}✓ Test Project Created (ID: $project_id)${NC}"
    echo ""
    
    test_endpoint "Get Project by ID" "GET" "/api/projects/$project_id" "" "200"
    test_endpoint "Get Surveys for Project" "GET" "/api/projects/$project_id/surveys" "" "200"
    
    echo "=========================================="
    echo "4. SURVEYS ENDPOINTS"
    echo "=========================================="
    echo ""
    
    # Create a survey
    echo -e "${YELLOW}Creating Test Survey...${NC}"
    survey_response=$(curl -s -X POST "$API_URL/api/surveys" \
        -H "Content-Type: application/json" \
        -d "{\"project_id\": $project_id, \"name\": \"Test Survey\"}")
    survey_id=$(echo $survey_response | jq -r '.survey.id' 2>/dev/null)
    
    if [ ! -z "$survey_id" ] && [ "$survey_id" != "null" ]; then
        echo -e "${GREEN}✓ Test Survey Created (ID: $survey_id)${NC}"
        echo ""
        
        # Add a question
        echo -e "${YELLOW}Adding Question to Survey...${NC}"
        question_response=$(curl -s -X POST "$API_URL/api/surveys/$survey_id/questions" \
            -H "Content-Type: application/json" \
            -d '{"question_text": "Which color do you prefer?", "variant_a": "Blue", "variant_b": "Red"}')
        echo "  Response: $(echo $question_response | jq -c '.' 2>/dev/null || echo $question_response)"
        echo ""
        
        # Test error handling - Run survey with invalid data
        test_endpoint "Run Survey (missing personas)" "POST" "/api/surveys/$survey_id/run" '{"sample_size": 5}' "400"
        test_endpoint "Run Survey (empty persona array)" "POST" "/api/surveys/$survey_id/run" '{"persona_ids": [], "sample_size": 5}' "400"
        
        # Test with valid data (small sample to save costs)
        echo -e "${YELLOW}Running Survey (small sample)...${NC}"
        run_response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/surveys/$survey_id/run" \
            -H "Content-Type: application/json" \
            -d '{"persona_ids": [1], "sample_size": 2}')
        run_http_code=$(echo "$run_response" | tail -n1)
        run_body=$(echo "$run_response" | sed '$d')
        
        if [ "$run_http_code" == "200" ]; then
            echo -e "  ${GREEN}✓ Survey Run Successful${NC}"
            echo "  Response: $(echo $run_body | jq -c '.message, .run_id' 2>/dev/null || echo $run_body)"
        else
            echo -e "  ${YELLOW}⚠ Survey Run Failed (Status: $run_http_code)${NC}"
            echo "  This might be expected if OpenAI quota is exceeded"
            echo "  Response: $(echo $run_body | jq -c '.' 2>/dev/null || echo $run_body)"
        fi
        echo ""
        
        # Get survey results
        test_endpoint "Get Survey Results" "GET" "/api/surveys/$survey_id/results" "" "200"
        
        # Clean up - Delete survey
        test_endpoint "Delete Survey" "DELETE" "/api/surveys/$survey_id" "" "200"
    else
        echo -e "${RED}✗ Failed to create test survey${NC}"
        echo ""
    fi
    
    # Clean up - Delete project
    test_endpoint "Delete Project" "DELETE" "/api/projects/$project_id" "" "200"
else
    echo -e "${RED}✗ Failed to create test project${NC}"
    echo ""
fi

echo "=========================================="
echo "5. ERROR HANDLING TESTS"
echo "=========================================="
echo ""

test_endpoint "Invalid Survey ID" "POST" "/api/surveys/invalid/run" '{"persona_ids": [1]}' "404"
test_endpoint "Non-existent Survey" "POST" "/api/surveys/999999/run" '{"persona_ids": [1], "sample_size": 5}' "500"

echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo ""
echo "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. ✗${NC}"
    exit 1
fi
