import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it } from "vitest";

import {
  createProjectDirectory,
  createProjectSceneFile,
  listProjectDirectories,
  listProjectFiles,
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

    await expect(listProjectFiles(root, "demo")).resolves.toEqual([
      expect.objectContaining({
        id: "homepage",
        projectId: "demo",
        name: "homepage.excalidraw",
      }),
    ]);

    await expect(
      readProjectSceneFile(root, "demo", "homepage"),
    ).resolves.toEqual(
      expect.objectContaining({
        file: expect.objectContaining({
          id: "homepage",
          name: "homepage.excalidraw",
        }),
        scene: { elements: [], appState: {}, files: {} },
      }),
    );
  });

  it("rejects traversal in project names", async () => {
    const root = mkdtempSync(join(tmpdir(), "excalidraw-projects-"));

    await expect(createProjectDirectory(root, "../evil")).rejects.toThrow(
      "Invalid path segment",
    );
  });
});
