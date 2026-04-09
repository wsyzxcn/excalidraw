export type RemoteProjectRouteState =
  | { mode: "projects" }
  | { mode: "project"; projectId: string }
  | { mode: "file"; projectId: string; fileId: string }
  | { mode: "editor" };

export const getRemoteProjectRouteState = (
  pathname: string,
): RemoteProjectRouteState => {
  const fileMatch = pathname.match(/^\/projects\/([^/]+)\/files\/([^/]+)$/);
  if (fileMatch) {
    return {
      mode: "file",
      projectId: decodeURIComponent(fileMatch[1]),
      fileId: decodeURIComponent(fileMatch[2]),
    };
  }

  const projectMatch = pathname.match(/^\/projects\/([^/]+)$/);
  if (projectMatch) {
    return {
      mode: "project",
      projectId: decodeURIComponent(projectMatch[1]),
    };
  }

  if (pathname === "/projects") {
    return { mode: "projects" };
  }

  return { mode: "editor" };
};

export const isRemoteProjectFileRoute = (pathname: string) =>
  getRemoteProjectRouteState(pathname).mode === "file";

export const getProjectsPath = () => "/projects";

export const getProjectPath = (projectId: string) =>
  `/projects/${encodeURIComponent(projectId)}`;

export const getProjectFilePath = (projectId: string, fileId: string) =>
  `/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(
    fileId,
  )}`;
