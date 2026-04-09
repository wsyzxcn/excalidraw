import { act, render, waitFor } from "@testing-library/react";

import App from "../App";
import { getProjectFile, saveProjectFile } from "../remote-projects/api";
import { getRemoteProjectRouteState } from "../remote-projects/store";

vi.mock("../remote-projects/api", () => ({
  getProjectFile: vi.fn(),
  saveProjectFile: vi.fn(),
}));

vi.mock("../remote-projects/store", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../remote-projects/store")>();

  return {
    ...mod,
    getRemoteProjectRouteState: vi.fn(() => ({
      mode: "file",
      projectId: "demo",
      fileId: "homepage",
    })),
  };
});

describe("remote project file save", () => {
  it("does not save an untouched remote file on initial render", async () => {
    vi.mocked(getRemoteProjectRouteState).mockReturnValue({
      mode: "file",
      projectId: "demo",
      fileId: "homepage",
    });
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
    vi.mocked(saveProjectFile).mockResolvedValue({
      id: "homepage",
      projectId: "demo",
      name: "homepage.excalidraw",
    });

    render(<App />);

    await waitFor(() => {
      expect(getProjectFile).toHaveBeenCalled();
    });

    expect(saveProjectFile).not.toHaveBeenCalled();
  });

  it("does not save the current remote file on Cmd/Ctrl+S when nothing changed", async () => {
    vi.mocked(getRemoteProjectRouteState).mockReturnValue({
      mode: "file",
      projectId: "demo",
      fileId: "homepage",
    });
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
    vi.mocked(saveProjectFile).mockResolvedValue({
      id: "homepage",
      projectId: "demo",
      name: "homepage.excalidraw",
    });

    render(<App />);

    await waitFor(() => {
      expect(getProjectFile).toHaveBeenCalled();
    });

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "s",
          metaKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    expect(saveProjectFile).not.toHaveBeenCalled();
  });
});
