import { Dialog } from "@excalidraw/excalidraw/components/Dialog";
import { FilledButton } from "@excalidraw/excalidraw/components/FilledButton";
import { TextField } from "@excalidraw/excalidraw/components/TextField";
import { ExcalLogo, LoadIcon } from "@excalidraw/excalidraw/components/icons";
import React from "react";

import type {
  RemoteProject,
  RemoteProjectFile,
} from "../../remote-projects/types";

const BackIcon = (
  <svg
    aria-hidden="true"
    viewBox="0 0 20 20"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12.5 4.5 7 10l5.5 5.5" />
    <path d="M7.5 10h8" />
  </svg>
);

export const ProjectsDialog: React.FC<{
  projects: RemoteProject[];
  files: RemoteProjectFile[];
  selectedProjectId: string | null;
  isProjectsLoading: boolean;
  isFilesLoading: boolean;
  projectsError: string | null;
  filesError: string | null;
  onCreateProject: (name: string) => void;
  onOpenProject: (projectId: string) => void;
  onBackToProjects: () => void;
  onCreateFile: (name: string) => void;
  onOpenFile: (fileId: string) => void;
  onCloseRequest: () => void;
}> = ({
  projects,
  files,
  selectedProjectId,
  isProjectsLoading,
  isFilesLoading,
  projectsError,
  filesError,
  onCreateProject,
  onOpenProject,
  onBackToProjects,
  onCreateFile,
  onOpenFile,
  onCloseRequest,
}) => {
  const [projectName, setProjectName] = React.useState("");
  const [fileName, setFileName] = React.useState("");

  const createProject = (event?: React.SyntheticEvent) => {
    event?.preventDefault();
    event?.stopPropagation();

    const trimmedName = projectName.trim();
    if (!trimmedName) {
      return;
    }
    onCreateProject(trimmedName);
    setProjectName("");
  };

  const createFile = (event?: React.SyntheticEvent) => {
    event?.preventDefault();
    event?.stopPropagation();

    const trimmedName = fileName.trim();
    if (!trimmedName) {
      return;
    }
    onCreateFile(trimmedName);
    setFileName("");
  };

  return (
    <Dialog
      size="small"
      title="Projects"
      className="ProjectsDialog"
      onCloseRequest={onCloseRequest}
    >
      <div className="remote-projects-page remote-projects-page--dialog">
        {selectedProjectId ? (
          <>
            <div className="remote-projects-page__toolbar">
              <button
                type="button"
                className="remote-projects-page__backButton"
                onClick={onBackToProjects}
              >
                <span className="remote-projects-page__backIcon">
                  {BackIcon}
                </span>
                <span>Back to projects</span>
              </button>
              <div className="remote-projects-page__subtitle">
                {selectedProjectId}
              </div>
            </div>
            {filesError ? <p>{filesError}</p> : null}
            {isFilesLoading ? <p>Loading...</p> : null}
            <div className="remote-projects-page__create">
              <TextField
                fullWidth
                label="File name"
                placeholder="File name"
                value={fileName}
                onChange={setFileName}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    createFile(event);
                  }
                }}
              />
              <FilledButton label="New file" onClick={createFile}>
                New file
              </FilledButton>
            </div>
            <ul className="remote-projects-page__list">
              {files.map((file) => (
                <li key={file.id}>
                  <button
                    type="button"
                    className="remote-projects-page__listButton"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onOpenFile(file.id);
                    }}
                  >
                    <span className="remote-projects-page__listIcon">
                      {ExcalLogo}
                    </span>
                    <span>{file.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            {projectsError ? <p>{projectsError}</p> : null}
            {isProjectsLoading ? <p>Loading...</p> : null}
            <div className="remote-projects-page__create">
              <TextField
                fullWidth
                label="Project name"
                placeholder="Project name"
                value={projectName}
                onChange={setProjectName}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    createProject(event);
                  }
                }}
              />
              <FilledButton label="New project" onClick={createProject}>
                New project
              </FilledButton>
            </div>
            <ul className="remote-projects-page__list">
              {projects.map((project) => (
                <li key={project.id}>
                  <button
                    type="button"
                    className="remote-projects-page__listButton"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onOpenProject(project.id);
                    }}
                  >
                    <span className="remote-projects-page__listIcon">
                      {LoadIcon}
                    </span>
                    <span>{project.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Dialog>
  );
};
