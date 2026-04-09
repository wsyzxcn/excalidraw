import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ProjectsFilesystemService } from "./projects-filesystem.service";
import { ProjectsService } from "./projects.service";

describe("ProjectsService", () => {
  let service: ProjectsService;

  beforeEach(() => {
    process.env.EXCALIDRAW_PROJECTS_ROOT = mkdtempSync(
      join(tmpdir(), "remote-projects-api-"),
    );
    service = new ProjectsService(new ProjectsFilesystemService());
  });

  afterEach(() => {
    delete process.env.EXCALIDRAW_PROJECTS_ROOT;
  });

  it("creates projects and lists them", async () => {
    await expect((service as any).createProject("demo")).resolves.toEqual(
      expect.objectContaining({
        id: "demo",
        name: "demo",
      }),
    );

    await expect((service as any).listProjects()).resolves.toEqual([
      expect.objectContaining({ id: "demo", name: "demo" }),
    ]);
  });

  it("creates, reads, and saves project files", async () => {
    await (service as any).createProject("demo");

    await expect(
      (service as any).createProjectFile("demo", "homepage"),
    ).resolves.toEqual(
      expect.objectContaining({
        id: "homepage",
        projectId: "demo",
        name: "homepage.excalidraw",
      }),
    );

    await expect((service as any).listProjectFiles("demo")).resolves.toEqual([
      expect.objectContaining({
        id: "homepage",
        projectId: "demo",
        name: "homepage.excalidraw",
      }),
    ]);

    await expect(
      (service as any).saveProjectFile("demo", "homepage", {
        elements: [],
        appState: { theme: "dark" },
        files: {},
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: "homepage",
        projectId: "demo",
        name: "homepage.excalidraw",
      }),
    );

    await expect(
      (service as any).getProjectFile("demo", "homepage"),
    ).resolves.toEqual(
      expect.objectContaining({
        file: expect.objectContaining({
          id: "homepage",
          projectId: "demo",
          name: "homepage.excalidraw",
        }),
        scene: {
          elements: [],
          appState: { theme: "dark" },
          files: {},
        },
      }),
    );
  });

  it("rejects path traversal in project names", async () => {
    await expect((service as any).createProject("../evil")).rejects.toThrow(
      "Invalid path segment",
    );
  });
});
