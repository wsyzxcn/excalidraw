import { describe, expect, it, vi } from "vitest";

import { initializeScene } from "../App";
import { getProjectFile } from "../remote-projects/api";

vi.mock("../remote-projects/api", () => ({
  getProjectFile: vi.fn(),
}));

describe("remote project file loading", () => {
  it("loads a remote file for a project file route", async () => {
    vi.mocked(getProjectFile).mockResolvedValue({
      file: {
        id: "homepage",
        projectId: "demo",
        name: "homepage.excalidraw",
      },
      scene: {
        elements: [],
        appState: {} as any,
        files: {},
      },
    });

    window.history.replaceState({}, "", "/projects/demo/files/homepage");

    const result = await initializeScene({
      collabAPI: null,
      excalidrawAPI: {
        getAppState: () => ({ viewBackgroundColor: "#ffffff" }),
        getSceneElementsIncludingDeleted: () => [],
      } as any,
    });

    expect(getProjectFile).toHaveBeenCalledWith("demo", "homepage");
    expect(result.scene?.elements).toEqual([]);
    expect(result.isExternalScene).toBe(false);
  });

  it("normalizes collaborators when loading a serialized remote file", async () => {
    vi.mocked(getProjectFile).mockResolvedValue({
      file: {
        id: "homepage",
        projectId: "demo",
        name: "homepage.excalidraw",
      },
      scene: {
        elements: [],
        appState: {
          collaborators: {},
        } as any,
        files: {},
      },
    });

    window.history.replaceState({}, "", "/projects/demo/files/homepage");

    const result = await initializeScene({
      collabAPI: null,
      excalidrawAPI: {
        getAppState: () => ({ viewBackgroundColor: "#ffffff" }),
        getSceneElementsIncludingDeleted: () => [],
      } as any,
    });

    expect(result.scene?.appState?.collaborators).toBeInstanceOf(Map);
  });
});
