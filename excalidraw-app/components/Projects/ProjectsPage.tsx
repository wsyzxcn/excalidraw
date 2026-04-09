import React from "react";

import type { RemoteProject } from "../../remote-projects/types";

export const ProjectsPage: React.FC<{
  projects: RemoteProject[];
  isLoading: boolean;
  errorMessage: string | null;
  onCreateProject: (name: string) => void;
  onOpenProject: (projectId: string) => void;
}> = ({
  projects,
  isLoading,
  errorMessage,
  onCreateProject,
  onOpenProject,
}) => {
  const [name, setName] = React.useState("");

  return (
    <section className="remote-projects-page">
      <h1>Projects</h1>
      {errorMessage ? <p>{errorMessage}</p> : null}
      {isLoading ? <p>Loading...</p> : null}
      <div className="remote-projects-page__create">
        <input
          aria-label="Project name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Project name"
        />
        <button
          onClick={() => {
            const trimmedName = name.trim();
            if (!trimmedName) {
              return;
            }
            onCreateProject(trimmedName);
            setName("");
          }}
        >
          New project
        </button>
      </div>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>
            <button onClick={() => onOpenProject(project.id)}>
              {project.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};
