# another.ai-app — Onboarding Guide (Developer)

Welcome! This guide gets a new developer up and running so they can contribute to the backend and deploy/run the project in AWS. It assumes you already have GitHub collaborator access to the repository.

Contents
- AWS from scratch
- Quick start (fastest path)
- Local development setup
- AWS / CDK / deploy setup
- Secrets & OpenAI
- Running and testing endpoints
- DB access and admin tasks
- Troubleshooting & common errors
- Workflow, PRs, and team practices
- Useful commands & snippets
- Checklist (copyable)

---

## AWS from scratch

1. Create an AWS account
   - Go to https://aws.amazon.com and click "Create an AWS Account".
   - Use a work or personal email that will own the account (project owners sometimes prefer a company-managed email).
   - Complete signup (billing information required). Wait for activation email and sign in.

2. Immediately secure the root account (do this first)
   - Enable MFA on the root user (virtual MFA or hardware key).
     - Console: IAM → Dashboard → Activate MFA on the root account.
   - Create a billing alarm / cost budget:
     - AWS Console → Billing → Budgets → Create budget → set a low threshold and add alert emails.
   - Avoid using the root account for daily work.

3. Create an IAM admin/developer user (do not use root for day-to-day)
   - Sign in as root → IAM → Users → Add user.
   - Username: choose meaningful name (e.g., firstname.lastname).
   - Access type: Programmatic access (for CLI/CDK) and Console access (optional).
   - For initial onboarding (fast): attach `AdministratorAccess` to a group and add the user to it.
     - Note: AdministratorAccess is broad — use only temporarily if you prefer a faster startup.
   - For production / longer-term: create a scoped, least-privilege policy (see step 7 below).

4. Secure the IAM user
   - Enable MFA for the IAM user:
     - IAM → Users → [user] → Security credentials → Assign MFA device.
   - Download Access Key ID and Secret Access Key (they will be shown once). Store securely.

5. Configure AWS CLI locally
   - Install AWS CLI v2.
   - Run:
     ```
     aws configure --profile anotherai-dev
     ```
     - Enter the Access Key ID, Secret Access Key, default region (e.g., `us-east-1`), default output `json`.
   - Verify:
     ```
     aws sts get-caller-identity --profile anotherai-dev
     ```

6. CDK deploy and least-privilege considerations
   - If the teammate will deploy CDK infra, they need permissions for CloudFormation, S3 (asset uploads), IAM:PassRole, Lambda, API Gateway, SecretsManager, EC2 (VPC/subnet), CloudWatch, and S3.
   - Quick option: use `AdministratorAccess` (fast, but broad).
   - Recommended option: request a tailored least-privilege IAM policy from the project owner—tell the owner the resources you need and I can generate a policy for you.
   - When ready to run CDK:
     ```
     npm i -g aws-cdk
     cdk bootstrap aws://ACCOUNT_ID/REGION --profile anotherai-dev
     cd infra
     cdk deploy --profile anotherai-dev
     ```

7. Secrets and RDS access
   - OpenAI and other secrets are stored in AWS Secrets Manager (example secret name: `anotherai/openai-api`).
   - Grant `secretsmanager:GetSecretValue` permission for the specific secret ARN to the user or role.
   - RDS is usually in a private VPC—laptops typically cannot reach it directly. Options:
     - Use the Admin Lambda (invoke-only) for migrations/seeding.
     - Use RDS Query Editor v2 in AWS Console.
     - Use Session Manager/SSM port forwarding or a bastion host for direct psql access (more setup; ask project owner).
   - Do NOT create public RDS endpoints unless you understand the security implications.

8. Cost control & safety
   - Add billing alarms and low-cost budgets.
   - Respect `DEFAULT_SAMPLE_SIZE` and `RUN_COST_CAP_USD` envs to avoid runaway OpenAI costs.
   - Monitor CloudWatch and Billing; shut down or scale back if unexpected.

---

## Quick start
1. Clone the repo:
   ```
   git clone git@github.com:zheruizz/another.ai-app.git
   cd another.ai-app/backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build TypeScript:
   ```
   npm run build
   ```

4. Run tests:
   ```
   npm run test
   ```

If you just want to hit the deployed API (no infra work) get the API invoke URL from the project owner and run the sample curl commands in "Running and testing endpoints".

---

## Local development setup

Prerequisites
- Node.js 18+ (or same major version used by repo)
- npm (or yarn)
- AWS CLI v2
- (If working on infra) AWS CDK v2 (`npm i -g aws-cdk`)
- Optional: Docker (if needed for other tasks)

Repository workflow
- Branch model: create `feature/<short-desc>` branches and open PRs against `main` (or the branch your team uses).
- Always run `npm run build` and `npm run test` before pushing a PR.

Local environment variables
- Create `backend/.env` (DO NOT COMMIT). Use `.env.example` from this repo as reference.
- Example `.env` (local dev):
  ```
  OPENAI_API_KEY=sk-...
  DB_HOST=<if you have local or tunneled access>
  DB_PORT=5432
  DB_USER=master
  DB_PASSWORD=...
  DB_NAME=postgres
  DB_SSL=false
  DEFAULT_SAMPLE_SIZE=3
  MAX_SAMPLE_SIZE=50
  ENABLE_RAW_OUTPUT=false
  ```

Note: Because RDS is usually in a private VPC, your laptop may not be able to connect directly. See "DB access and admin tasks" below.

---

## AWS / CDK / deploy setup

1. Configure AWS credentials:
   ```
   aws configure --profile anotherai-dev
   ```

2. Bootstrap CDK (first time in the account/region):
   ```
   cd infra
   cdk bootstrap aws://ACCOUNT_ID/REGION --profile anotherai-dev
   ```

3. Deploy infra:
   ```
   cdk diff --profile anotherai-dev
   cdk deploy --profile anotherai-dev
   ```

Notes:
- The CDK stack contains Lambdas in private subnets—ensure NAT gateway(s) for outbound internet (OpenAI).
- CDK manages Lambda environment variables; do not rely on manual console changes if you track infra via CDK.

Lambda build & deploy quick flow
- After code changes:
  ```
  cd backend
  npm run build
  cd ../infra
  cdk deploy --profile anotherai-dev
  ```

---

## Secrets & OpenAI

Store OpenAI key in AWS Secrets Manager (recommended) under the secret name used by infra (example: `anotherai/openai-api`) with JSON:
```json
{ "OPENAI_API_KEY": "sk-REPLACE_ME" }
```

Local development
- If you do not have Secrets Manager access, add `OPENAI_API_KEY` to `backend/.env` for local testing.
- The code prefers Secrets Manager if `OPENAI_SECRET_NAME` and `OPENAI_REGION` are set; otherwise falls back to `OPENAI_API_KEY`.

Guardrails
- Use small default sample size in dev (`DEFAULT_SAMPLE_SIZE=3`) to limit cost.
- RUN_COST_CAP_USD is enforced by code—do not exceed it.

---

## Running and testing endpoints

Get the API base URL from API Gateway Console:
- AWS Console → API Gateway → Rest APIs → select API → Stages → copy Invoke URL
Set in terminal:
```
export BASE_URL="https://{apiId}.execute-api.{region}.amazonaws.com/prod"
```

Sample commands (use `jq` for pretty JSON):

- Health:
  ```
  curl -sS "$BASE_URL/hello" | jq .
  ```

- List personas:
  ```
  curl -sS "$BASE_URL/api/personas" | jq .
  ```

- Create a project:
  ```
  curl -sS -X POST "$BASE_URL/api/projects" \
    -H "Content-Type: application/json" \
    -d '{"user_id": null, "name": "Demo Project", "description": "Test"}' | jq .
  ```

- Create a survey:
  ```
  curl -sS -X POST "$BASE_URL/api/surveys" \
    -H "Content-Type: application/json" \
    -d '{"project_id": 1, "name": "Feature Test"}' | jq .
  ```

- Add a question:
  ```
  curl -sS -X POST "$BASE_URL/api/surveys/<SURVEY_ID>/questions" \
    -H "Content-Type: application/json" \
    -d '{
      "question_text": "You are evaluating a new water bottle.",
      "variant_a": "Insulated, 24oz, screw cap.",
      "variant_b": "Lightweight, 20oz, flip-top lid."
    }' | jq .
  ```

- Run survey (small sample for testing):
  ```
  curl -sS -X POST "$BASE_URL/api/surveys/<SURVEY_ID>/run" \
    -H "Content-Type: application/json" \
    -d '{"persona_ids":[1,2],"sample_size":3}' | jq .
  ```

- Get aggregated results:
  ```
  curl -sS "$BASE_URL/api/surveys/<SURVEY_ID>/results" | jq .
  ```

Troubleshooting:
- If POST /run returns 5xx or times out: check CloudWatch logs for the surveys Lambda.
- Common causes: SecretsManager access denied, no NAT egress, OpenAI API key missing, RDS connection errors.

---

## DB access and admin tasks

Local laptops usually cannot reach RDS in a private VPC. Options:

1. Admin Lambda (recommended)
   - We provide an invoke-only Admin Lambda to run safe admin ops (seed personas, run a single SELECT/UPDATE).
   - Invoke from Console or CLI:
     ```
     aws lambda invoke --function-name AdminDbLambda --payload '{"op":"seed_personas"}' result.json --profile anotherai-dev
     ```

2. RDS Query Editor (AWS Console)
   - Query Editor v2 allows running SQL in the browser (requires IAM permission).

3. Session Manager / Bastion
   - Use SSM Session Manager or a bastion EC2 instance for port-forwarding to RDS.

Avoid exposing an HTTP "run arbitrary SQL" endpoint. Use Admin Lambda or console tooling.

---

## Troubleshooting & common errors

1. SecretsManager AccessDeniedException
   - Symptom: Lambda logs show permission error when reading secret.
   - Fix: Grant `secretsmanager:GetSecretValue` to the Lambda role for the secret ARN (CDK helper or IAM console).

2. No route to host / OpenAI requests failing
   - Symptom: network errors reaching api.openai.com.
   - Fix: Ensure Lambdas in private subnets have a NAT Gateway route for outbound internet.

3. DB connection errors (ECONNREFUSED / timeout)
   - Symptom: pooling/connection errors in Lambda logs or local run.
   - Fix: Ensure DB_HOST, DB_USER, DB_PASSWORD are correct. If the DB is private, use Admin Lambda or tunnel.

4. CDK deploy failures (CloudFormation errors)
   - Inspect CloudFormation Console for stack events. Often the error contains required IAM `PassRole` or resource conflict details.

5. TS build/test failures locally
   - Run `npm run build` and fix TypeScript errors reported by `tsc`. Ensure matching Node and TypeScript versions as in `backend/tsconfig.json`.

---

## Useful commands & snippets

- Install deps:
  ```
  npm install
  ```

- Build:
  ```
  npm run build
  ```

- Test:
  ```
  npm run test
  ```

- CDK bootstrap:
  ```
  cdk bootstrap aws://ACCOUNT_ID/REGION --profile anotherai-dev
  ```

- CDK deploy:
  ```
  cd infra
  cdk deploy --profile anotherai-dev
  ```

- Invoke admin Lambda:
  ```
  aws lambda invoke --function-name AdminDbLambda \
    --payload '{"op":"seed_personas"}' result.json --profile anotherai-dev
  ```

- View lambda logs:
  ```
  aws logs filter-log-events --log-group-name /aws/lambda/<FunctionName> --profile anotherai-dev
  ```

---

## .env.example
(Do NOT commit real secrets; copy to `.env` and fill values.)
```
# OpenAI
OPENAI_API_KEY=

# Database (local dev only; production uses Secrets Manager)
DB_HOST=
DB_PORT=5432
DB_USER=master
DB_PASSWORD=
DB_NAME=postgres
DB_SSL=false

# App defaults
DEFAULT_SAMPLE_SIZE=3
MAX_SAMPLE_SIZE=50
ENABLE_RAW_OUTPUT=false
MODEL_NAME=gpt-4o-mini
RUN_COST_CAP_USD=4
```

---

## Checklist (copyable)
- [ ] GitHub access and clone repo
- [ ] Node 18+ and npm installed
- [ ] `npm install` successful
- [ ] `npm run build` successful
- [ ] `npm run test` passes
- [ ] AWS CLI configured (`aws configure --profile anotherai-dev`)
- [ ] CDK bootstrap done (if needed)
- [ ] Deployed infra via `cdk deploy` (if contributing infra)
- [ ] OpenAI key present locally or readable via Secrets Manager
- [ ] Able to run a smoke test: create survey → add question → run with sample_size=3 → get results
- [ ] Familiar with CloudWatch logs and where to find them
