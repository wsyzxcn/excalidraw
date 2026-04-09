import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
    globalThis.fetch = vi.fn() as typeof globalThis.fetch;
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

  it("creates, lists, reads, and saves project files through resource endpoints", async () => {
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ project: { id: "demo", name: "demo" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            files: [
              {
                id: "homepage",
                projectId: "demo",
                name: "homepage.excalidraw",
              },
            ],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            file: {
              id: "homepage",
              projectId: "demo",
              name: "homepage.excalidraw",
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            file: {
              id: "homepage",
              projectId: "demo",
              name: "homepage.excalidraw",
            },
            scene: { elements: [], appState: {}, files: {} },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
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
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

    await expect(createProject("demo")).resolves.toEqual({
      id: "demo",
      name: "demo",
    });

    await expect(listProjectFiles("demo")).resolves.toEqual([
      {
        id: "homepage",
        projectId: "demo",
        name: "homepage.excalidraw",
      },
    ]);

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
        appState: {} as any,
        files: {},
      }),
    ).resolves.toEqual({
      id: "homepage",
      projectId: "demo",
      name: "homepage.excalidraw",
      updatedAt: "2026-04-09T09:15:00.000Z",
    });
  });
});
