# another.ai-app

This is the application codebase for [another.ai](https://github.com/dcsil/another.ai).  
It is scaffolded to support a modern, AWS-native, scalable architecture as described in the ADRs.

## Directory Structure

- `frontend/` — Next.js app, deployed via AWS Amplify
- `backend/` — TypeScript AWS Lambda handlers for API Gateway
- `database/` — Aurora PostgreSQL schemas and migration scripts
- `infra/` — Infrastructure as Code (IaC), deployment scripts, CI/CD config
- `docs/` — Developer documentation, setup guides, architecture references

## Getting Started

1. See ADRs in [`dcsil/another.ai`](https://github.com/dcsil/another.ai/tree/master/architecture/adrs) for tech stack and architecture decisions.
2. Each subfolder contains its own setup instructions and starter code.

## Current Focus

Building an agent-based website testing MVP:
- Agent test runners that execute tasks in real browsers (Playwright)
- Task suggestion system for any URL
- Test result tracking with videos and scores
- Infrastructure and secrets managed via AWS