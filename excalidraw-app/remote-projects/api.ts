import type {
  RemoteProject,
  RemoteProjectFile,
  RemoteProjectScene,
} from "./types";

const JSON_HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
} as const;

const readJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(`Remote projects request failed: ${response.status}`);
  }

  return (await response.json()) as T;
};

export const listProjects = async (): Promise<RemoteProject[]> => {
  const response = await fetch("/api/projects", {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const data = await readJson<{ projects: RemoteProject[] }>(response);
  return data.projects;
};

export const createProject = async (name: string): Promise<RemoteProject> => {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ name }),
  });

  const data = await readJson<{ project: RemoteProject }>(response);
  return data.project;
};

export const listProjectFiles = async (
  projectId: string,
): Promise<RemoteProjectFile[]> => {
  const response = await fetch(`/api/projects/${projectId}/files`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const data = await readJson<{ files: RemoteProjectFile[] }>(response);
  return data.files;
};

export const createProjectFile = async (
  projectId: string,
  name: string,
): Promise<RemoteProjectFile> => {
  const response = await fetch(`/api/projects/${projectId}/files`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ name }),
  });

  const data = await readJson<{ file: RemoteProjectFile }>(response);
  return data.file;
};

export const getProjectFile = async (
  projectId: string,
  fileId: string,
): Promise<{ file: RemoteProjectFile; scene: RemoteProjectScene }> => {
  const response = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  return readJson<{ file: RemoteProjectFile; scene: RemoteProjectScene }>(
    response,
  );
};

export const saveProjectFile = async (
  projectId: string,
  fileId: string,
  scene: RemoteProjectScene,
): Promise<RemoteProjectFile> => {
  const response = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify({ scene }),
  });

  const data = await readJson<{ file: RemoteProjectFile }>(response);
  return data.file;
};
