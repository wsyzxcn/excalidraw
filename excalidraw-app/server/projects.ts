import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const ensureSafeSegment = (value: string) => {
  if (!/^[A-Za-z0-9._-]+$/.test(value) || value.includes("..")) {
    throw new Error("Invalid path segment");
  }

  return value;
};

const getResolvedRoot = (root: string) => resolve(root);

const getProjectDir = (root: string, projectId: string) =>
  join(getResolvedRoot(root), ensureSafeSegment(projectId));

const getSceneFilePath = (root: string, projectId: string, fileId: string) =>
  join(
    getProjectDir(root, projectId),
    `${ensureSafeSegment(fileId)}.excalidraw`,
  );

export const createProjectDirectory = async (root: string, name: string) => {
  const projectId = ensureSafeSegment(name);
  await mkdir(getProjectDir(root, projectId));

  return {
    id: projectId,
    name: projectId,
  };
};

export const createProjectSceneFile = async (
  root: string,
  projectId: string,
  fileId: string,
) => {
  const normalizedFileId = ensureSafeSegment(fileId);

  await writeFile(
    getSceneFilePath(root, projectId, normalizedFileId),
    JSON.stringify({ elements: [], appState: {}, files: {} }, null, 2),
  );

  return {
    id: normalizedFileId,
    projectId,
    name: `${normalizedFileId}.excalidraw`,
  };
};

export const saveProjectSceneFile = async (
  root: string,
  projectId: string,
  fileId: string,
  scene: unknown,
) => {
  await writeFile(
    getSceneFilePath(root, projectId, fileId),
    JSON.stringify(scene, null, 2),
  );
};

export const readProjectSceneFile = async (
  root: string,
  projectId: string,
  fileId: string,
) => {
  const raw = await readFile(getSceneFilePath(root, projectId, fileId), "utf8");

  return {
    file: {
      id: ensureSafeSegment(fileId),
      projectId: ensureSafeSegment(projectId),
      name: `${ensureSafeSegment(fileId)}.excalidraw`,
    },
    scene: JSON.parse(raw),
  };
};

export const listProjectDirectories = async (root: string) => {
  const entries = await readdir(getResolvedRoot(root), { withFileTypes: true });

  return Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const info = await stat(join(getResolvedRoot(root), entry.name));
        return {
          id: entry.name,
          name: entry.name,
          createdAt: info.birthtime.toISOString(),
          updatedAt: info.mtime.toISOString(),
        };
      }),
  );
};

export const listProjectFiles = async (root: string, projectId: string) => {
  const projectDir = getProjectDir(root, projectId);
  const entries = await readdir(projectDir, { withFileTypes: true });

  return Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".excalidraw"))
      .map(async (entry) => {
        const info = await stat(join(projectDir, entry.name));
        return {
          id: entry.name.replace(/\.excalidraw$/, ""),
          projectId: ensureSafeSegment(projectId),
          name: entry.name,
          createdAt: info.birthtime.toISOString(),
          updatedAt: info.mtime.toISOString(),
        };
      }),
  );
};
