# Remote Projects Design

**Date:** 2026-04-09

**Status:** Draft for review

## Goal

Add a remote-project workflow to the Excalidraw web app so users can:

- view remote projects
- create a project
- view files inside a project
- create a file inside a project
- open a remote `.excalidraw` file in the editor
- save editor changes back to the remote file

This MVP intentionally treats a "project" as a server-side directory and a "file" as a server-side `.excalidraw` file managed through an HTTP API.

## Scope

### In scope

- Add a projects entry point in the app shell
- Add a remote projects list page
- Add a remote project file list page
- Add create-project flow
- Add create-file flow
- Add open-file flow from project file list into the editor
- Add save-file flow from the editor back to the HTTP API
- Add API client code in `excalidraw-app`
- Define a file-system-backed HTTP API contract

### Out of scope

- Database-backed project storage
- Nested folders inside a project
- Permissions and auth
- Multi-user editing conflict resolution
- Version history
- Trash/recycle bin
- Project sharing
- Migrating current collab/share-link flows to the project model

## Product Model

The product keeps a project/file abstraction in the frontend, while the backend maps those abstractions to directories and files on disk.

### Project

A project is a directory located under a backend-configured root directory.

Example:

```text
$EXCALIDRAW_PROJECTS_ROOT/demo-project/
```

### File

A file is a `.excalidraw` document stored inside a project directory.

Example:

```text
$EXCALIDRAW_PROJECTS_ROOT/demo-project/homepage.excalidraw
```

### Backend root

The backend root directory must be configured through an environment variable.

Example:

```bash
EXCALIDRAW_PROJECTS_ROOT=/srv/excalidraw-projects
```

The frontend must never know or construct absolute server-side paths.

## UX Flow

### Main flow

1. User opens the app.
2. User enters the projects area.
3. User creates a project or opens an existing one.
4. User sees the `.excalidraw` files in that project.
5. User creates a new file or opens an existing file.
6. The app loads the file contents into the Excalidraw editor.
7. The user edits the scene.
8. The app saves the updated scene back to the backend using the file API.

### URL model

The app should add app-level routes for project navigation:

- `/projects`
- `/projects/:projectId`
- `/projects/:projectId/files/:fileId`

These routes belong in `excalidraw-app` and must not require invasive editor-core changes.

## Architecture

The feature should live in the application layer, not the reusable editor package.

### Why this boundary

`packages/excalidraw` is the editor engine and UI library. Project navigation, remote file browsing, and backend integration are app concerns already consistent with the current repository split.

The implementation should therefore:

- keep project navigation in `excalidraw-app`
- keep HTTP API integration in `excalidraw-app`
- reuse existing Excalidraw serialization and restoration utilities
- minimize changes to `packages/excalidraw`

### High-level frontend structure

Recommended new modules:

- `excalidraw-app/remote-projects/types.ts`
  Shared project/file/scene metadata types for the app layer
- `excalidraw-app/remote-projects/api.ts`
  HTTP client for project and file operations
- `excalidraw-app/remote-projects/store.ts`
  Current project/file/loading/saving state
- `excalidraw-app/components/Projects/*`
  Projects list and project files UI

Recommended integration points:

- `excalidraw-app/components/AppWelcomeScreen.tsx`
  Add a projects entry point
- `excalidraw-app/App.tsx`
  Route between projects pages and editor mode, load remote file initial data, handle remote saves

## Data Model

The frontend should use stable logical resources, not raw file-system paths.

### Project shape

```ts
type Project = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};
```

### Project file shape

```ts
type ProjectFile = {
  id: string;
  projectId: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};
```

### Remote scene payload

For the MVP, the backend should return and persist Excalidraw scene JSON directly:

```ts
type RemoteScene = {
  elements: readonly unknown[];
  appState: Record<string, unknown>;
  files: Record<string, unknown>;
};
```

The precise element and app-state typing in code should reuse existing Excalidraw types instead of redefining them.

## HTTP API Contract

The frontend should talk to resource-oriented endpoints instead of direct file-system verbs.

### List projects

`GET /api/projects`

Response:

```json
{
  "projects": [
    {
      "id": "demo-project",
      "name": "demo-project",
      "createdAt": "2026-04-09T09:00:00.000Z",
      "updatedAt": "2026-04-09T09:00:00.000Z"
    }
  ]
}
```

### Create project

`POST /api/projects`

Request:

```json
{
  "name": "demo-project"
}
```

Response:

```json
{
  "project": {
    "id": "demo-project",
    "name": "demo-project"
  }
}
```

### List files in a project

`GET /api/projects/:projectId/files`

Response:

```json
{
  "files": [
    {
      "id": "homepage",
      "projectId": "demo-project",
      "name": "homepage.excalidraw",
      "updatedAt": "2026-04-09T09:10:00.000Z"
    }
  ]
}
```

### Create file

`POST /api/projects/:projectId/files`

Request:

```json
{
  "name": "homepage"
}
```

Response:

```json
{
  "file": {
    "id": "homepage",
    "projectId": "demo-project",
    "name": "homepage.excalidraw"
  }
}
```

### Read file

`GET /api/projects/:projectId/files/:fileId`

Response:

```json
{
  "file": {
    "id": "homepage",
    "projectId": "demo-project",
    "name": "homepage.excalidraw",
    "updatedAt": "2026-04-09T09:12:00.000Z"
  },
  "scene": {
    "elements": [],
    "appState": {},
    "files": {}
  }
}
```

### Save file

`PUT /api/projects/:projectId/files/:fileId`

Request:

```json
{
  "scene": {
    "elements": [],
    "appState": {},
    "files": {}
  }
}
```

Response:

```json
{
  "file": {
    "id": "homepage",
    "projectId": "demo-project",
    "name": "homepage.excalidraw",
    "updatedAt": "2026-04-09T09:15:00.000Z"
  }
}
```

## Backend File-System Rules

The backend is responsible for translating logical IDs into disk paths safely.

### Required guarantees

- Read project root from `EXCALIDRAW_PROJECTS_ROOT`
- Create the root if desired at deployment time, not from frontend assumptions
- Only allow operations under the configured root
- Reject path traversal attempts such as `..`, `/`, `\\`, and encoded traversal
- Restrict managed files to `.excalidraw`
- Reject duplicate project names and duplicate file names with `409 Conflict`
- Return `404` for unknown project or file

### Name normalization

For the MVP, names should be simple and predictable:

- Project names map to directory names
- File creation requests may accept `homepage` and persist as `homepage.excalidraw`
- The backend should normalize the extension so the frontend does not have to

## Frontend Behavior

### Project list page

The page should:

- fetch and display projects
- allow creating a project
- navigate into a project on click

### Project file list page

The page should:

- fetch and display `.excalidraw` files for the selected project
- allow creating a file
- navigate into the editor route when a file is selected

### Editor page for remote file

When the route points to a remote file:

- fetch file contents from the backend
- restore scene data using existing Excalidraw data utilities
- render the editor with that scene
- preserve local user preferences where appropriate

### Saving behavior

For the MVP, save behavior should be conservative and explicit in implementation:

- remote file changes save through the file API
- save failures must show a visible error state
- the app should avoid pretending data is saved when the request failed

The exact trigger can be wired to the existing save flow in `App.tsx` during implementation, but it must remain single-writer oriented and not attempt multi-user merge logic.

## Error Handling

The app should surface understandable failures for:

- project list fetch failure
- project creation failure
- file list fetch failure
- file creation failure
- file load failure
- file save failure

The backend should use standard status codes where practical:

- `400` invalid name
- `404` project or file not found
- `409` duplicate project or file
- `500` unexpected server-side file-system failure

## Testing Strategy

### Frontend tests

- API client tests for request/response handling
- projects list UI tests
- project files list UI tests
- remote file load/save behavior tests

### Backend tests

- environment-variable root resolution
- project directory creation
- file creation with extension normalization
- file read and write
- invalid-name rejection
- path traversal rejection

### End-to-end MVP scenario

1. Create project
2. Create file
3. Open file
4. Draw or edit scene
5. Save file
6. Reload and verify content persists

## Risks and Trade-Offs

### Why not use a database

The user explicitly does not want database-backed storage. A file-system-backed backend keeps deployment simple and aligns the user-facing project model with real directories on the server.

### Why not put this into `packages/excalidraw`

Doing so would mix app navigation and backend storage concerns into the editor library. That would increase the maintenance burden and make the MVP unnecessarily invasive.

### Known MVP limitations

- No concurrent-edit conflict handling
- No file version history
- No nested directories
- No auth design yet

These are acceptable for the first iteration because they do not block the main project/file workflow.

## Implementation Direction

The follow-up implementation plan should assume:

- frontend changes happen primarily in `excalidraw-app`
- backend API support will be added separately for directory-backed project storage
- existing Excalidraw scene serialization/restoration code is reused instead of inventing a new document format
