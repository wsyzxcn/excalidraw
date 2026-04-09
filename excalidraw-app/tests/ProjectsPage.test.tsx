import { fireEvent, render, screen } from "@testing-library/react";

import { ProjectFilesPage } from "../components/Projects/ProjectFilesPage";
import { ProjectsPage } from "../components/Projects/ProjectsPage";

describe("ProjectsPage", () => {
  it("renders projects and forwards open-project actions", async () => {
    const onCreateProject = vi.fn();
    const onOpenProject = vi.fn();

    await render(
      <ProjectsPage
        projects={[{ id: "demo", name: "demo" }]}
        isLoading={false}
        errorMessage={null}
        onCreateProject={onCreateProject}
        onOpenProject={onOpenProject}
      />,
    );

    fireEvent.click(screen.getByText("demo"));

    expect(onOpenProject).toHaveBeenCalledWith("demo");
  });

  it("renders project files and forwards open-file actions", async () => {
    const onOpenFile = vi.fn();

    await render(
      <ProjectFilesPage
        projectName="demo"
        files={[
          {
            id: "homepage",
            projectId: "demo",
            name: "homepage.excalidraw",
          },
        ]}
        isLoading={false}
        errorMessage={null}
        onCreateFile={() => {}}
        onOpenFile={onOpenFile}
      />,
    );

    fireEvent.click(screen.getByText("homepage.excalidraw"));

    expect(onOpenFile).toHaveBeenCalledWith("homepage");
  });
});
