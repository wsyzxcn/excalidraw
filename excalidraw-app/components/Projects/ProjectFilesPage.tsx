import React from "react";

import type { RemoteProjectFile } from "../../remote-projects/types";

export const ProjectFilesPage: React.FC<{
  projectName: string;
  files: RemoteProjectFile[];
  isLoading: boolean;
  errorMessage: string | null;
  onCreateFile: (name: string) => void;
  onOpenFile: (fileId: string) => void;
}> = ({
  projectName,
  files,
  isLoading,
  errorMessage,
  onCreateFile,
  onOpenFile,
}) => {
  const [name, setName] = React.useState("");

  return (
    <section className="remote-projects-page">
      <h1>{projectName}</h1>
      {errorMessage ? <p>{errorMessage}</p> : null}
      {isLoading ? <p>Loading...</p> : null}
      <div className="remote-projects-page__create">
        <input
          aria-label="File name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="File name"
        />
        <button
          onClick={() => {
            const trimmedName = name.trim();
            if (!trimmedName) {
              return;
            }
            onCreateFile(trimmedName);
            setName("");
          }}
        >
          New file
        </button>
      </div>
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
