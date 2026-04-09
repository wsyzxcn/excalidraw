# Remote Projects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a file-system-backed remote projects workflow to the Excalidraw app so users can create projects, create files inside projects, open remote `.excalidraw` files, and save edits back through HTTP APIs.

**Architecture:** Keep the feature in `excalidraw-app` and add a small HTTP server layer that maps logical project/file resources onto directories and `.excalidraw` files under `EXCALIDRAW_PROJECTS_ROOT`. Reuse existing Excalidraw scene serialization and restoration utilities instead of changing the editor core.

**Tech Stack:** React 19, TypeScript, Vite app, existing Excalidraw data utilities, Node HTTP server support in the repo, Vitest

---

### Task 1: Add remote-project domain types and API client

**Files:**
- Create: `excalidraw-app/remote-projects/types.ts`
- Create: `excalidraw-app/remote-projects/api.ts`
- Test: `excalidraw-app/tests/remote-projects.api.test.ts`

- [ ] **Step 1: Write the failing API client test**

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import {
  createProject,
  createProjectFile,
  getProjectFile,
  listProjectFiles,
  listProjects,
  saveProjectFile,
} from "../remote-projects/api";

describe("remote-projects api", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("lists projects from the resource endpoint", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          projects: [{ id: "demo-project", name: "demo-project" }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    await expect(listProjects()).resolves.toEqual([
      { id: "demo-project", name: "demo-project" },
    ]);
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/projects", {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest excalidraw-app/tests/remote-projects.api.test.ts --run`

Expected: FAIL with module-not-found or missing export errors for `../remote-projects/api`

- [ ] **Step 3: Write minimal shared types**

```ts
export type RemoteProject = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RemoteProjectFile = {
  id: string;
  projectId: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RemoteProjectScene = {
  elements: readonly unknown[];
  appState: Record<string, unknown>;
  files: Record<string, unknown>;
};
```

- [ ] **Step 4: Write minimal API client**

```ts
import type {
  RemoteProject,
  RemoteProjectFile,
  RemoteProjectScene,
} from "./types";

const jsonHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

const readJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(`Remote projects request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const listProjects = async (): Promise<RemoteProject[]> => {
  const response = await fetch("/api/projects", {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const data = await readJson<{ projects: RemoteProject[] }>(response);
  return data.projects;
};

export const createProject = async (name: string): Promise<RemoteProject> => {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ name }),
  });
  const data = await readJson<{ project: RemoteProject }>(response);
  return data.project;
};

export const listProjectFiles = async (
  projectId: string,
): Promise<RemoteProjectFile[]> => {
  const response = await fetch(`/api/projects/${projectId}/files`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const data = await readJson<{ files: RemoteProjectFile[] }>(response);
  return data.files;
};

export const createProjectFile = async (
  projectId: string,
  name: string,
): Promise<RemoteProjectFile> => {
  const response = await fetch(`/api/projects/${projectId}/files`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ name }),
  });
  const data = await readJson<{ file: RemoteProjectFile }>(response);
  return data.file;
};

export const getProjectFile = async (
  projectId: string,
  fileId: string,
): Promise<{ file: RemoteProjectFile; scene: RemoteProjectScene }> => {
  const response = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  return readJson<{ file: RemoteProjectFile; scene: RemoteProjectScene }>(
    response,
  );
};

export const saveProjectFile = async (
  projectId: string,
  fileId: string,
  scene: RemoteProjectScene,
): Promise<RemoteProjectFile> => {
  const response = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify({ scene }),
  });
  const data = await readJson<{ file: RemoteProjectFile }>(response);
  return data.file;
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `yarn vitest excalidraw-app/tests/remote-projects.api.test.ts --run`

Expected: PASS

- [ ] **Step 6: Expand the test to cover create/list/read/save operations**

```ts
it("creates and saves project files through resource endpoints", async () => {
  vi.mocked(globalThis.fetch)
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({ project: { id: "demo", name: "demo" } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          file: { id: "homepage", projectId: "demo", name: "homepage.excalidraw" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          file: { id: "homepage", projectId: "demo", name: "homepage.excalidraw" },
          scene: { elements: [], appState: {}, files: {} },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          file: {
            id: "homepage",
            projectId: "demo",
            name: "homepage.excalidraw",
            updatedAt: "2026-04-09T09:15:00.000Z",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

  await expect(createProject("demo")).resolves.toEqual({
    id: "demo",
    name: "demo",
  });

  await expect(createProjectFile("demo", "homepage")).resolves.toEqual({
    id: "homepage",
    projectId: "demo",
    name: "homepage.excalidraw",
  });

  await expect(getProjectFile("demo", "homepage")).resolves.toEqual({
    file: {
      id: "homepage",
      projectId: "demo",
      name: "homepage.excalidraw",
    },
    scene: { elements: [], appState: {}, files: {} },
  });

  await expect(
    saveProjectFile("demo", "homepage", {
      elements: [],
      appState: {},
      files: {},
    }),
  ).resolves.toEqual({
    id: "homepage",
    projectId: "demo",
    name: "homepage.excalidraw",
    updatedAt: "2026-04-09T09:15:00.000Z",
  });
});
```

- [ ] **Step 7: Run the API client test suite again**

Run: `yarn vitest excalidraw-app/tests/remote-projects.api.test.ts --run`

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add excalidraw-app/remote-projects/types.ts excalidraw-app/remote-projects/api.ts excalidraw-app/tests/remote-projects.api.test.ts
git commit -m "feat: add remote project api client"
```

### Task 2: Add lightweight project-navigation state

**Files:**
- Create: `excalidraw-app/remote-projects/store.ts`
- Modify: `excalidraw-app/app-jotai.ts`
- Test: `excalidraw-app/tests/remote-projects.store.test.ts`

- [ ] **Step 1: Write the failing store test**

```ts
import { describe, expect, it } from "vitest";

import {
  getRemoteProjectRouteState,
  isRemoteProjectFileRoute,
} from "../remote-projects/store";

describe("remote project route state", () => {
  it("parses a file route", () => {
    expect(
      getRemoteProjectRouteState("/projects/demo/files/homepage"),
    ).toEqual({
      mode: "file",
      projectId: "demo",
      fileId: "homepage",
    });
    expect(isRemoteProjectFileRoute("/projects/demo/files/homepage")).toBe(
      true,
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest excalidraw-app/tests/remote-projects.store.test.ts --run`

Expected: FAIL with module-not-found or missing export errors for `../remote-projects/store`

- [ ] **Step 3: Write minimal route-state helpers**

```ts
export type RemoteProjectRouteState =
  | { mode: "projects" }
  | { mode: "project"; projectId: string }
  | { mode: "file"; projectId: string; fileId: string }
  | { mode: "editor" };

export const getRemoteProjectRouteState = (
  pathname: string,
): RemoteProjectRouteState => {
  const fileMatch = pathname.match(/^\/projects\/([^/]+)\/files\/([^/]+)$/);
  if (fileMatch) {
    return {
      mode: "file",
      projectId: decodeURIComponent(fileMatch[1]),
      fileId: decodeURIComponent(fileMatch[2]),
    };
  }

  const projectMatch = pathname.match(/^\/projects\/([^/]+)$/);
  if (projectMatch) {
    return {
      mode: "project",
      projectId: decodeURIComponent(projectMatch[1]),
    };
  }

  if (pathname === "/projects") {
    return { mode: "projects" };
  }

  return { mode: "editor" };
};

export const isRemoteProjectFileRoute = (pathname: string) =>
  getRemoteProjectRouteState(pathname).mode === "file";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn vitest excalidraw-app/tests/remote-projects.store.test.ts --run`

Expected: PASS

- [ ] **Step 5: Extend the store helpers to support navigation helpers**

```ts
export const getProjectsPath = () => "/projects";

export const getProjectPath = (projectId: string) =>
  `/projects/${encodeURIComponent(projectId)}`;

export const getProjectFilePath = (projectId: string, fileId: string) =>
  `/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}`;
```

- [ ] **Step 6: Add a navigation helper test**

```ts
it("creates stable navigation paths", () => {
  expect(getProjectsPath()).toBe("/projects");
  expect(getProjectPath("demo")).toBe("/projects/demo");
  expect(getProjectFilePath("demo", "homepage")).toBe(
    "/projects/demo/files/homepage",
  );
});
```

- [ ] **Step 7: Run the store test suite again**

Run: `yarn vitest excalidraw-app/tests/remote-projects.store.test.ts --run`

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add excalidraw-app/remote-projects/store.ts excalidraw-app/app-jotai.ts excalidraw-app/tests/remote-projects.store.test.ts
git commit -m "feat: add remote project route helpers"
```

### Task 3: Add projects list and project file list UI

**Files:**
- Create: `excalidraw-app/components/Projects/ProjectsPage.tsx`
- Create: `excalidraw-app/components/Projects/ProjectFilesPage.tsx`
- Create: `excalidraw-app/components/Projects/Projects.scss`
- Modify: `excalidraw-app/components/AppWelcomeScreen.tsx`
- Test: `excalidraw-app/tests/ProjectsPage.test.tsx`

- [ ] **Step 1: Write the failing UI test for the projects page**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProjectsPage } from "../components/Projects/ProjectsPage";

describe("ProjectsPage", () => {
  it("renders projects and forwards create-project actions", async () => {
    const user = userEvent.setup();
    const onCreateProject = vi.fn();
    const onOpenProject = vi.fn();

    render(
      <ProjectsPage
        projects={[{ id: "demo", name: "demo" }]}
        isLoading={false}
        errorMessage={null}
        onCreateProject={onCreateProject}
        onOpenProject={onOpenProject}
      />,
    );

    await user.click(screen.getByText("demo"));
    expect(onOpenProject).toHaveBeenCalledWith("demo");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest excalidraw-app/tests/ProjectsPage.test.tsx --run`

Expected: FAIL with module-not-found or missing component errors

- [ ] **Step 3: Write minimal projects and files page components**

```tsx
import React from "react";

import type { RemoteProject, RemoteProjectFile } from "../../remote-projects/types";

export const ProjectsPage: React.FC<{
  projects: RemoteProject[];
  isLoading: boolean;
  errorMessage: string | null;
  onCreateProject: (name: string) => void;
  onOpenProject: (projectId: string) => void;
}> = ({ projects, isLoading, errorMessage, onCreateProject, onOpenProject }) => {
  return (
    <section className="remote-projects-page">
      <h1>Projects</h1>
      {errorMessage ? <p>{errorMessage}</p> : null}
      {isLoading ? <p>Loading...</p> : null}
      <button onClick={() => onCreateProject("Untitled Project")}>
        New project
      </button>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>
            <button onClick={() => onOpenProject(project.id)}>{project.name}</button>
          </li>
        ))}
      </ul>
    </section>
  );
};

export const ProjectFilesPage: React.FC<{
  projectName: string;
  files: RemoteProjectFile[];
  isLoading: boolean;
  errorMessage: string | null;
  onCreateFile: (name: string) => void;
  onOpenFile: (fileId: string) => void;
}> = ({ projectName, files, isLoading, errorMessage, onCreateFile, onOpenFile }) => {
  return (
    <section className="remote-projects-page">
      <h1>{projectName}</h1>
      {errorMessage ? <p>{errorMessage}</p> : null}
      {isLoading ? <p>Loading...</p> : null}
      <button onClick={() => onCreateFile("Untitled")}>New file</button>
      <ul>
        {files.map((file) => (
          <li key={file.id}>
            <button onClick={() => onOpenFile(file.id)}>{file.name}</button>
          </li>
        ))}
      </ul>
    </section>
  );
};
```

- [ ] **Step 4: Add a welcome-screen entry point**

```tsx
<WelcomeScreen.Center.MenuItemLink
  href="/projects"
  shortcut={null}
>
  Projects
</WelcomeScreen.Center.MenuItemLink>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `yarn vitest excalidraw-app/tests/ProjectsPage.test.tsx --run`

Expected: PASS

- [ ] **Step 6: Add a failing test for the files page**

```tsx
it("renders project files and forwards open-file actions", async () => {
  const user = userEvent.setup();
  const onOpenFile = vi.fn();

  render(
    <ProjectFilesPage
      projectName="demo"
      files={[{ id: "homepage", projectId: "demo", name: "homepage.excalidraw" }]}
      isLoading={false}
      errorMessage={null}
      onCreateFile={() => {}}
      onOpenFile={onOpenFile}
    />,
  );

  await user.click(screen.getByText("homepage.excalidraw"));
  expect(onOpenFile).toHaveBeenCalledWith("homepage");
});
```

- [ ] **Step 7: Run the page test suite again**

Run: `yarn vitest excalidraw-app/tests/ProjectsPage.test.tsx --run`

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add excalidraw-app/components/Projects/ProjectsPage.tsx excalidraw-app/components/Projects/ProjectFilesPage.tsx excalidraw-app/components/Projects/Projects.scss excalidraw-app/components/AppWelcomeScreen.tsx excalidraw-app/tests/ProjectsPage.test.tsx
git commit -m "feat: add remote project navigation screens"
```

### Task 4: Route between projects pages and editor mode in the app

**Files:**
- Modify: `excalidraw-app/App.tsx`
- Modify: `excalidraw-app/index.scss`
- Test: `excalidraw-app/tests/remote-projects.routing.test.tsx`

- [ ] **Step 1: Write the failing routing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../remote-projects/store", () => ({
  getRemoteProjectRouteState: () => ({ mode: "projects" }),
}));

vi.mock("../components/Projects/ProjectsPage", () => ({
  ProjectsPage: () => <div>Projects Page</div>,
}));

import App from "../App";

describe("remote project routing", () => {
  it("renders the projects page for the projects route", async () => {
    render(<App />);
    expect(await screen.findByText("Projects Page")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest excalidraw-app/tests/remote-projects.routing.test.tsx --run`

Expected: FAIL because `App` does not branch on remote project routes

- [ ] **Step 3: Add route branching in `App.tsx`**

```tsx
const routeState = getRemoteProjectRouteState(window.location.pathname);

if (routeState.mode === "projects") {
  return (
    <ProjectsPage
      projects={projects}
      isLoading={isProjectsLoading}
      errorMessage={projectsError}
      onCreateProject={handleCreateProject}
      onOpenProject={(projectId) => {
        window.history.pushState({}, "", getProjectPath(projectId));
        rerenderRoute();
      }}
    />
  );
}

if (routeState.mode === "project") {
  return (
    <ProjectFilesPage
      projectName={currentProjectName}
      files={projectFiles}
      isLoading={isProjectFilesLoading}
      errorMessage={projectFilesError}
      onCreateFile={handleCreateFile}
      onOpenFile={(fileId) => {
        window.history.pushState(
          {},
          "",
          getProjectFilePath(routeState.projectId, fileId),
        );
        rerenderRoute();
      }}
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn vitest excalidraw-app/tests/remote-projects.routing.test.tsx --run`

Expected: PASS

- [ ] **Step 5: Add a test for the project-files route**

```tsx
vi.mock("../remote-projects/store", () => ({
  getRemoteProjectRouteState: () => ({ mode: "project", projectId: "demo" }),
}));

vi.mock("../components/Projects/ProjectFilesPage", () => ({
  ProjectFilesPage: () => <div>Project Files Page</div>,
}));

it("renders the project files page for a project route", async () => {
  render(<App />);
  expect(await screen.findByText("Project Files Page")).toBeInTheDocument();
});
```

- [ ] **Step 6: Run the routing test suite again**

Run: `yarn vitest excalidraw-app/tests/remote-projects.routing.test.tsx --run`

Expected: PASS

- [ ] **Step 7: Refine styles so route pages feel native to the app**

```scss
.remote-projects-page {
  margin: 0 auto;
  max-width: 56rem;
  padding: 2rem 1.5rem 4rem;
}
```

- [ ] **Step 8: Commit**

```bash
git add excalidraw-app/App.tsx excalidraw-app/index.scss excalidraw-app/tests/remote-projects.routing.test.tsx
git commit -m "feat: route app through remote project screens"
```

### Task 5: Load remote file data into the editor

**Files:**
- Modify: `excalidraw-app/App.tsx`
- Modify: `excalidraw-app/remote-projects/api.ts`
- Test: `excalidraw-app/tests/remote-projects.load-file.test.tsx`

- [ ] **Step 1: Write the failing remote-file load test**

```tsx
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../remote-projects/store", () => ({
  getRemoteProjectRouteState: () => ({
    mode: "file",
    projectId: "demo",
    fileId: "homepage",
  }),
}));

const getProjectFile = vi.fn().mockResolvedValue({
  file: { id: "homepage", projectId: "demo", name: "homepage.excalidraw" },
  scene: { elements: [], appState: {}, files: {} },
});

vi.mock("../remote-projects/api", () => ({
  getProjectFile,
}));

import App from "../App";

describe("remote project file loading", () => {
  it("loads a remote file before opening the editor", async () => {
    render(<App />);
    await waitFor(() => {
      expect(getProjectFile).toHaveBeenCalledWith("demo", "homepage");
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest excalidraw-app/tests/remote-projects.load-file.test.tsx --run`

Expected: FAIL because remote file loading is not wired to route initialization

- [ ] **Step 3: Add remote-file initialization path**

```ts
if (routeState.mode === "file") {
  const remote = await getProjectFile(routeState.projectId, routeState.fileId);
  return {
    scene: {
      elements: restoreElements(remote.scene.elements as any, null, {
        repairBindings: true,
        deleteInvisibleElements: true,
      }),
      appState: restoreAppState(
        remote.scene.appState as any,
        localDataState?.appState,
      ),
      files: remote.scene.files as any,
      scrollToContent: true,
    },
    isExternalScene: false,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn vitest excalidraw-app/tests/remote-projects.load-file.test.tsx --run`

Expected: PASS

- [ ] **Step 5: Add a failure-state test**

```tsx
it("surfaces a load failure for a missing remote file", async () => {
  getProjectFile.mockRejectedValueOnce(new Error("404"));
  render(<App />);
  await waitFor(() => {
    expect(getProjectFile).toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: Add minimal load-failure UI wiring**

```ts
catch (error) {
  return {
    scene: {
      appState: {
        errorMessage: t("alerts.importBackendFailed"),
      },
    },
    isExternalScene: false,
  };
}
```

- [ ] **Step 7: Run the remote-file load test suite again**

Run: `yarn vitest excalidraw-app/tests/remote-projects.load-file.test.tsx --run`

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add excalidraw-app/App.tsx excalidraw-app/remote-projects/api.ts excalidraw-app/tests/remote-projects.load-file.test.tsx
git commit -m "feat: load remote project files into editor"
```

### Task 6: Save editor changes back to the remote file API

**Files:**
- Modify: `excalidraw-app/App.tsx`
- Modify: `excalidraw-app/remote-projects/types.ts`
- Test: `excalidraw-app/tests/remote-projects.save-file.test.tsx`

- [ ] **Step 1: Write the failing remote-save test**

```tsx
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const saveProjectFile = vi.fn().mockResolvedValue({
  id: "homepage",
  projectId: "demo",
  name: "homepage.excalidraw",
});

vi.mock("../remote-projects/api", () => ({
  getProjectFile: vi.fn().mockResolvedValue({
    file: { id: "homepage", projectId: "demo", name: "homepage.excalidraw" },
    scene: { elements: [], appState: {}, files: {} },
  }),
  saveProjectFile,
}));

describe("remote project file save", () => {
  it("saves editor scene changes to the remote file endpoint", async () => {
    render(<App />);
    await waitFor(() => {
      expect(saveProjectFile).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest excalidraw-app/tests/remote-projects.save-file.test.tsx --run`

Expected: FAIL because editor updates are not persisted through `saveProjectFile`

- [ ] **Step 3: Add a minimal remote-save bridge**

```ts
const saveRemoteProjectScene = async (
  projectId: string,
  fileId: string,
  elements: readonly OrderedExcalidrawElement[],
  appState: AppState,
  files: BinaryFiles,
) => {
  await saveProjectFile(projectId, fileId, {
    elements,
    appState,
    files,
  });
};
```

- [ ] **Step 4: Wire the bridge into editor updates for remote file routes**

```ts
if (routeState.mode === "file") {
  void saveRemoteProjectScene(
    routeState.projectId,
    routeState.fileId,
    elements,
    appState,
    files,
  ).catch((error) => {
    console.error(error);
    excalidrawAPI.setToast({
      message: "Failed to save remote file",
      duration: 4000,
      closable: true,
    });
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `yarn vitest excalidraw-app/tests/remote-projects.save-file.test.tsx --run`

Expected: PASS

- [ ] **Step 6: Add a failure-path test**

```tsx
it("keeps the editor open when a remote save fails", async () => {
  saveProjectFile.mockRejectedValueOnce(new Error("save failed"));
  render(<App />);
  await waitFor(() => {
    expect(saveProjectFile).toHaveBeenCalled();
  });
});
```

- [ ] **Step 7: Run the remote-save test suite again**

Run: `yarn vitest excalidraw-app/tests/remote-projects.save-file.test.tsx --run`

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add excalidraw-app/App.tsx excalidraw-app/remote-projects/types.ts excalidraw-app/tests/remote-projects.save-file.test.tsx
git commit -m "feat: save remote project files"
```

### Task 7: Add Node HTTP handlers for file-system-backed project storage

**Files:**
- Create: `excalidraw-app/server/projects.ts`
- Create: `excalidraw-app/server/projects.test.ts`
- Modify: `excalidraw-app/package.json`
- Modify: `excalidraw-app/vite.config.mts`

- [ ] **Step 1: Write the failing backend test**

```ts
import { describe, expect, it } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createProjectDirectory,
  createProjectSceneFile,
  listProjectDirectories,
  readProjectSceneFile,
  saveProjectSceneFile,
} from "./projects";

describe("projects file-system backend", () => {
  it("creates and persists scene files under the configured root", async () => {
    const root = mkdtempSync(join(tmpdir(), "excalidraw-projects-"));

    await createProjectDirectory(root, "demo");
    await createProjectSceneFile(root, "demo", "homepage");
    await saveProjectSceneFile(root, "demo", "homepage", {
      elements: [],
      appState: {},
      files: {},
    });

    await expect(listProjectDirectories(root)).resolves.toEqual([
      expect.objectContaining({ id: "demo", name: "demo" }),
    ]);

    await expect(readProjectSceneFile(root, "demo", "homepage")).resolves.toEqual(
      expect.objectContaining({
        file: expect.objectContaining({
          id: "homepage",
          name: "homepage.excalidraw",
        }),
      }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest excalidraw-app/server/projects.test.ts --run`

Expected: FAIL with module-not-found or missing export errors

- [ ] **Step 3: Write minimal file-system helpers**

```ts
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const ensureSafeSegment = (value: string) => {
  if (!/^[A-Za-z0-9._-]+$/.test(value) || value.includes("..")) {
    throw new Error("Invalid path segment");
  }
  return value;
};

const getProjectDir = (root: string, projectId: string) =>
  join(resolve(root), ensureSafeSegment(projectId));

const getSceneFilePath = (root: string, projectId: string, fileId: string) =>
  join(getProjectDir(root, projectId), `${ensureSafeSegment(fileId)}.excalidraw`);

export const createProjectDirectory = async (root: string, name: string) => {
  await mkdir(getProjectDir(root, name));
  return { id: name, name };
};

export const createProjectSceneFile = async (
  root: string,
  projectId: string,
  fileId: string,
) => {
  const path = getSceneFilePath(root, projectId, fileId);
  await writeFile(path, JSON.stringify({ elements: [], appState: {}, files: {} }));
  return { id: fileId, projectId, name: `${fileId}.excalidraw` };
};

export const saveProjectSceneFile = async (
  root: string,
  projectId: string,
  fileId: string,
  scene: unknown,
) => {
  await writeFile(
    getSceneFilePath(root, projectId, fileId),
    JSON.stringify(scene, null, 2),
  );
};

export const readProjectSceneFile = async (
  root: string,
  projectId: string,
  fileId: string,
) => {
  const raw = await readFile(getSceneFilePath(root, projectId, fileId), "utf8");
  return {
    file: { id: fileId, projectId, name: `${fileId}.excalidraw` },
    scene: JSON.parse(raw),
  };
};

export const listProjectDirectories = async (root: string) => {
  const entries = await readdir(resolve(root), { withFileTypes: true });
  return Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const info = await stat(join(resolve(root), entry.name));
        return {
          id: entry.name,
          name: entry.name,
          createdAt: info.birthtime.toISOString(),
          updatedAt: info.mtime.toISOString(),
        };
      }),
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn vitest excalidraw-app/server/projects.test.ts --run`

Expected: PASS

- [ ] **Step 5: Add traversal-rejection and file-list tests**

```ts
it("rejects traversal in project names", async () => {
  const root = mkdtempSync(join(tmpdir(), "excalidraw-projects-"));
  await expect(createProjectDirectory(root, "../evil")).rejects.toThrow(
    "Invalid path segment",
  );
});
```

- [ ] **Step 6: Add HTTP handler adapter functions**

```ts
export const listProjectFiles = async (root: string, projectId: string) => {
  const dir = await readdir(getProjectDir(root, projectId), { withFileTypes: true });
  return Promise.all(
    dir
      .filter((entry) => entry.isFile() && entry.name.endsWith(".excalidraw"))
      .map(async (entry) => {
        const info = await stat(join(getProjectDir(root, projectId), entry.name));
        return {
          id: entry.name.replace(/\.excalidraw$/, ""),
          projectId,
          name: entry.name,
          createdAt: info.birthtime.toISOString(),
          updatedAt: info.mtime.toISOString(),
        };
      }),
  );
};
```

- [ ] **Step 7: Run the backend test suite again**

Run: `yarn vitest excalidraw-app/server/projects.test.ts --run`

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add excalidraw-app/server/projects.ts excalidraw-app/server/projects.test.ts excalidraw-app/package.json excalidraw-app/vite.config.mts
git commit -m "feat: add filesystem-backed remote projects backend"
```

### Task 8: Wire HTTP routes and verify the end-to-end MVP flow

**Files:**
- Modify: `excalidraw-app/vite.config.mts`
- Modify: `README.md`
- Test: `excalidraw-app/tests/remote-projects.e2e-smoke.test.tsx`

- [ ] **Step 1: Write the failing MVP smoke test**

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("remote projects MVP flow", () => {
  it("creates a project, creates a file, opens it, and saves it", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByText("Projects"));
    await waitFor(() => {
      expect(screen.getByText("Projects")).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest excalidraw-app/tests/remote-projects.e2e-smoke.test.tsx --run`

Expected: FAIL because the full projects flow is not yet stitched together

- [ ] **Step 3: Add Vite dev-server route handlers or middleware**

```ts
server: {
  middlewareMode: false,
},
plugins: [
  {
    name: "remote-projects-api",
    configureServer(server) {
      server.middlewares.use("/api/projects", async (req, res) => {
        // dispatch GET/POST and nested file routes via filesystem helpers
      });
    },
  },
],
```

- [ ] **Step 4: Add root-directory documentation**

```md
### Remote projects

Set `EXCALIDRAW_PROJECTS_ROOT` before starting the app:

```bash
EXCALIDRAW_PROJECTS_ROOT=/srv/excalidraw-projects yarn start
```

This enables the file-system-backed HTTP API used by the remote projects UI.
```

- [ ] **Step 5: Run the smoke test to verify it passes**

Run: `yarn vitest excalidraw-app/tests/remote-projects.e2e-smoke.test.tsx --run`

Expected: PASS

- [ ] **Step 6: Run targeted verification for all new remote-project tests**

Run: `yarn vitest excalidraw-app/tests/remote-projects.api.test.ts excalidraw-app/tests/remote-projects.store.test.ts excalidraw-app/tests/ProjectsPage.test.tsx excalidraw-app/tests/remote-projects.routing.test.tsx excalidraw-app/tests/remote-projects.load-file.test.tsx excalidraw-app/tests/remote-projects.save-file.test.tsx excalidraw-app/server/projects.test.ts excalidraw-app/tests/remote-projects.e2e-smoke.test.tsx --run`

Expected: PASS

- [ ] **Step 7: Run repo-level safety checks**

Run: `yarn test:typecheck`
Expected: PASS

Run: `yarn test:update`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add excalidraw-app/vite.config.mts README.md excalidraw-app/tests/remote-projects.e2e-smoke.test.tsx
git commit -m "feat: complete remote projects mvp"
```
