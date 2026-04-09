# Remote Projects NestJS Implementation Plan

## Goal

Implement a production-ready NestJS backend for remote projects inside the monorepo, proxy frontend development traffic to it, and support deployment as a separate backend container.

## Scope

In scope:

- add a NestJS service at `services/remote-projects-api`
- implement `/api/projects` filesystem-backed endpoints
- preserve the current frontend HTTP contract
- proxy Vite dev requests to the NestJS service
- remove the Vite-only backend middleware
- add Docker support for a separate backend container

Out of scope:

- auth
- permissions
- database storage
- realtime collaboration on project files
- version history

## Execution Order

### Task 1: Scaffold the NestJS service

Create the service skeleton under `services/remote-projects-api`.

Deliverables:

- NestJS package manifest
- TypeScript config
- bootstrap entry
- root module
- basic health/startup sanity

Notes:

- keep dependencies minimal
- service must run independently from the frontend

### Task 2: Implement filesystem-backed project domain

Port the current directory/file logic into the NestJS service.

Deliverables:

- filesystem service for project/file operations
- shared path validation
- DTOs for request payloads
- controller/service split

Endpoints:

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:projectId/files`
- `POST /api/projects/:projectId/files`
- `GET /api/projects/:projectId/files/:fileId`
- `PUT /api/projects/:projectId/files/:fileId`

Validation:

- reject invalid segments
- reject traversal attempts
- return `404`, `409`, `400`, `500` consistently

### Task 3: Add backend tests

Add targeted tests around the NestJS service and filesystem behavior.

Coverage:

- create/list projects
- create/list files
- load/save file
- duplicate handling
- invalid name/path rejection
- root directory environment resolution

### Task 4: Wire frontend development to NestJS

Replace the Vite middleware with proxy behavior.

Deliverables:

- remove or disable `viteRemoteProjectsApi`
- add Vite dev proxy for `/api/projects`
- keep frontend client unchanged

Notes:

- frontend should continue using relative `/api/projects` URLs
- dev should require the NestJS backend to be running

### Task 5: Remove Vite-only backend implementation

Delete the temporary development-only server path once the NestJS backend is active.

Deliverables:

- remove `excalidraw-app/server/viteRemoteProjectsApi.ts`
- remove Vite plugin registration
- keep any reusable filesystem logic only if it now lives in the NestJS service

### Task 6: Add production containerization

Make the backend deployable alongside the frontend.

Deliverables:

- Dockerfile for `services/remote-projects-api`
- root-level or deployment-level compose/config for two-container setup
- backend env wiring for `EXCALIDRAW_PROJECTS_ROOT`
- persistent storage volume mount guidance

Expected runtime:

- frontend container serves static app
- backend container serves `/api/projects`

### Task 7: Add reverse proxy wiring

Ensure deployed frontend can reach the backend through `/api/projects`.

Deliverables:

- reverse proxy config or compose networking guidance
- same-origin path routing for `/api/projects`

### Task 8: Update docs

Document both local development and deployment.

Deliverables:

- how to run frontend + NestJS locally
- required environment variables
- Docker deployment instructions
- storage root configuration

### Task 9: End-to-end verification

Verify the full remote project workflow through the new backend.

Checklist:

- create project
- create file
- open file
- switch files
- edit and save
- reload and confirm persistence
- confirm Docker path can reach backend

## Risks and Mitigations

### Risk: frontend contract drift

Mitigation:

- keep frontend API client unchanged
- build backend responses to match existing shapes exactly

### Risk: dev setup becomes harder

Mitigation:

- document exact commands
- use a simple Vite proxy
- keep backend startup straightforward

### Risk: filesystem behavior differs from current dev mode

Mitigation:

- reuse current semantics deliberately
- port existing tests and add integration coverage

### Risk: Docker deploy still misses API routing

Mitigation:

- verify with explicit reverse proxy configuration
- include deployment docs and smoke-test commands

## Verification Commands

Planned verification after implementation:

- backend tests for NestJS service
- existing remote-project frontend tests
- `eslint --max-warnings=0`
- `tsc -p tsconfig.json --noEmit`
- local dev smoke test with frontend proxying to NestJS
- Docker smoke test with frontend + backend containers

## Recommended Implementation Strategy

Implement backend first, then switch dev proxy, then remove the Vite middleware, then add Docker integration. This keeps the frontend stable while the backend changes underneath it and minimizes broken intermediate states.
