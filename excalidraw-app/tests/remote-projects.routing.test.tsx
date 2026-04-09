import { render, screen } from "@testing-library/react";

import App from "../App";
import { getRemoteProjectRouteState } from "../remote-projects/store";

vi.mock("../remote-projects/store", () => ({
  getRemoteProjectRouteState: vi.fn(() => ({ mode: "projects" })),
}));

vi.mock("../components/Projects/ProjectsPage", () => ({
  ProjectsPage: () => <div>Projects Page</div>,
}));

vi.mock("../components/Projects/ProjectFilesPage", () => ({
  ProjectFilesPage: () => <div>Project Files Page</div>,
}));

vi.mock("@excalidraw/excalidraw", async (importOriginal) => {
  const mod =
    await importOriginal<typeof import("@excalidraw/excalidraw")>();

  return {
    ...mod,
    ExcalidrawAPIProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    useExcalidrawAPI: () => null,
    useEditorInterface: () => ({ formFactor: "desktop" }),
  };
});

describe("remote project routing", () => {
  const mockedGetRemoteProjectRouteState = vi.mocked(getRemoteProjectRouteState);

  it("renders the projects page for the projects route", async () => {
    mockedGetRemoteProjectRouteState.mockReturnValue({ mode: "projects" });

    render(<App />);

    expect(await screen.findByText("Projects Page")).toBeInTheDocument();
  });

  it("renders the project files page for a project route", async () => {
    mockedGetRemoteProjectRouteState.mockReturnValue({
      mode: "project",
      projectId: "demo",
    });

    render(<App />);

    expect(await screen.findByText("Project Files Page")).toBeInTheDocument();
  });
});
