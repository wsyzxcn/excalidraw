# Remote Projects NestJS Design

## Goal

Replace the current Vite-only remote projects backend with a real NestJS service that works in both development and production.

The frontend should keep using the same `/api/projects` HTTP contract. In development, Vite should proxy requests to the NestJS service. In production, the deployed frontend should also route `/api/projects` to the same NestJS service.

## Non-Goals

- No database
- No auth or permissions in this phase
- No nested folders inside projects
- No realtime collaboration for project files
- No version history or recycle bin

## Current Problem

The current implementation provides `/api/projects` through a Vite dev middleware in [viteRemoteProjectsApi.ts](/Users/staky/workspace/excalidraw/excalidraw-app/server/viteRemoteProjectsApi.ts). This works only when running the Vite dev server.

Production Docker builds only ship static frontend assets via nginx, so the API disappears after deployment. That creates an environment mismatch:

- local development works
- deployed containers lose project APIs

## Desired End State

There is one backend implementation only: a NestJS service inside the monorepo.

- Development:
  - frontend runs in Vite
  - NestJS runs separately
  - Vite proxies `/api/projects` to NestJS
- Production:
  - frontend runs as static assets
  - NestJS runs as a separate container
  - reverse proxy forwards `/api/projects` to NestJS

This removes the dev/prod behavior mismatch.

## Repo Layout

Add a new service:

`services/remote-projects-api`

Suggested structure:

- `services/remote-projects-api/src/main.ts`
- `services/remote-projects-api/src/app.module.ts`
- `services/remote-projects-api/src/projects/projects.module.ts`
- `services/remote-projects-api/src/projects/projects.controller.ts`
- `services/remote-projects-api/src/projects/projects.service.ts`
- `services/remote-projects-api/src/projects/projects-filesystem.service.ts`
- `services/remote-projects-api/src/projects/dto/*.ts`

The existing filesystem logic in [projects.ts](/Users/staky/workspace/excalidraw/excalidraw-app/server/projects.ts) should be moved or copied into the NestJS service and become the canonical implementation.

The Vite middleware in [viteRemoteProjectsApi.ts](/Users/staky/workspace/excalidraw/excalidraw-app/server/viteRemoteProjectsApi.ts) should be removed after the proxy path is working.

## API Contract

Keep the current frontend contract unchanged:

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:projectId/files`
- `POST /api/projects/:projectId/files`
- `GET /api/projects/:projectId/files/:fileId`
- `PUT /api/projects/:projectId/files/:fileId`

Response shapes should remain compatible with the current client in [api.ts](/Users/staky/workspace/excalidraw/excalidraw-app/remote-projects/api.ts).

## Data Model

Project:

- `id`
- `name`
- `createdAt`
- `updatedAt`

Project file:

- `id`
- `projectId`
- `name`
- `createdAt`
- `updatedAt`

Scene payload:

- `elements`
- `appState`
- `files`

The existing remote scene normalization rules should stay in place:

- runtime-only app state such as `collaborators` must not be persisted
- invalid serialized collaborator state must be normalized on load

## Storage Strategy

The service stores all data in the filesystem.

Root directory resolution:

1. `EXCALIDRAW_PROJECTS_ROOT` if set
2. fallback to repository-local `data/projects` for development

Mapping:

- project = root subdirectory
- file = `<fileId>.excalidraw` under that project directory

Path safety rules:

- allow only `[A-Za-z0-9._-]`
- reject `..`
- never accept raw filesystem paths from the client

## NestJS Responsibilities

### ProjectsController

Expose the REST API and validate route/body inputs.

### ProjectsService

Coordinate project and file operations and translate domain errors into HTTP errors:

- invalid name => `400`
- duplicate project/file => `409`
- missing project/file => `404`
- unknown error => `500`

### ProjectsFilesystemService

Own all direct filesystem access:

- create directory
- list projects
- create file
- list files
- read file
- write file

This service is the replacement for the current Vite-only helper layer.

## Frontend Changes

Frontend request paths stay the same.

Required frontend changes are minimal:

- keep using [api.ts](/Users/staky/workspace/excalidraw/excalidraw-app/remote-projects/api.ts)
- remove dependency on Vite dev middleware existence
- point Vite dev server proxy to the NestJS backend

No feature-level UI behavior should change because of this backend migration.

## Development Setup

Development should run two processes:

1. Vite frontend
2. NestJS backend

Vite config should proxy:

- `/api/projects` -> NestJS base URL

Suggested env vars:

- frontend: `VITE_REMOTE_PROJECTS_API=http://127.0.0.1:4000`
- backend: `PORT=4000`
- backend: `EXCALIDRAW_PROJECTS_ROOT=...`

If the proxy is same-origin in dev, the frontend can continue using relative `/api/projects` URLs without any API client changes.

## Production / Docker

Use two containers:

1. frontend container
   - static assets only
   - nginx or equivalent

2. NestJS API container
   - serves `/api/projects`
   - mounts persistent project storage volume

Reverse proxy behavior:

- `/api/projects` routes to NestJS container
- all other routes serve frontend static assets

Required Docker work:

- new Dockerfile for NestJS service
- compose or deployment config wiring frontend + backend together
- persistent volume for project data

## Migration Strategy

1. Add NestJS service with matching `/api/projects` behavior
2. Reuse current filesystem semantics and response shapes
3. Add Vite proxy to NestJS
4. Remove Vite middleware implementation
5. Add production container wiring
6. Verify frontend works unchanged in dev and production

## Testing

### Backend tests

- project creation
- duplicate name conflict
- file creation
- file listing
- file load
- file save
- invalid path rejection
- root dir env handling

### Frontend tests

- existing remote-project frontend tests continue to pass
- API client tests remain valid because the contract does not change

### Integration tests

- create project -> create file -> open file -> edit -> save
- switch between project files and confirm loaded scene changes

### Deployment verification

- Vite dev with NestJS proxy works
- Docker two-container stack serves frontend and `/api/projects`

## Risks

### Risk: dev/prod divergence remains

Mitigation:
- remove Vite middleware instead of keeping two backend implementations

### Risk: path traversal or unsafe filenames

Mitigation:
- centralize validation in NestJS filesystem service

### Risk: Docker deploy still serves stale frontend without backend

Mitigation:
- document the two-container setup explicitly
- verify `/api/projects` routing in deployment

## Open Implementation Choices

The following should be decided in implementation, but they do not change the overall design:

- exact NestJS bootstrap style
- whether to use `@nestjs/config`
- exact reverse proxy config format
- whether compose files live at repo root or deployment-specific path

## Recommendation

Implement a dedicated NestJS service in `services/remote-projects-api`, keep the frontend API contract unchanged, proxy dev traffic from Vite to NestJS, and deploy frontend + backend as two containers.

This is the cleanest way to make remote projects real in production without introducing a database or splitting logic across multiple backend implementations.
