import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { Injectable } from "@nestjs/common";

export type ProjectRecord = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectFileRecord = {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

const EMPTY_SCENE = {
  elements: [],
  appState: {},
  files: {},
};

@Injectable()
export class ProjectsFilesystemService {
  private ensureSafeSegment(value: string) {
    if (!/^[A-Za-z0-9._-]+$/.test(value) || value.includes("..")) {
      throw new Error("Invalid path segment");
    }

    return value;
  }

  getConfiguredRoot() {
    const root =
      process.env.EXCALIDRAW_PROJECTS_ROOT ||
      resolve(process.cwd(), "..", "..", "data", "projects");

    return root;
  }

  async ensureRoot() {
    const root = this.getConfiguredRoot();
    await mkdir(root, { recursive: true });
    return root;
  }

  private getProjectDir(projectId: string) {
    return join(this.getConfiguredRoot(), this.ensureSafeSegment(projectId));
  }

  private getSceneFilePath(projectId: string, fileId: string) {
    return join(
      this.getProjectDir(projectId),
      `${this.ensureSafeSegment(fileId)}.excalidraw`,
    );
  }

  async listProjects(): Promise<ProjectRecord[]> {
    const root = await this.ensureRoot();
    const entries = await readdir(root, { withFileTypes: true });

    return Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          const info = await stat(join(root, entry.name));
          return {
            id: entry.name,
            name: entry.name,
            createdAt: info.birthtime.toISOString(),
            updatedAt: info.mtime.toISOString(),
          };
        }),
    );
  }

  async createProject(name: string): Promise<ProjectRecord> {
    const projectId = this.ensureSafeSegment(name);
    const projectDir = this.getProjectDir(projectId);
    await this.ensureRoot();
    await mkdir(projectDir);
    const info = await stat(projectDir);

    return {
      id: projectId,
      name: projectId,
      createdAt: info.birthtime.toISOString(),
      updatedAt: info.mtime.toISOString(),
    };
  }

  async listProjectFiles(projectId: string): Promise<ProjectFileRecord[]> {
    const projectDir = this.getProjectDir(projectId);
    const entries = await readdir(projectDir, { withFileTypes: true });

    return Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".excalidraw"))
        .map(async (entry) => {
          const info = await stat(join(projectDir, entry.name));
          return {
            id: entry.name.replace(/\.excalidraw$/, ""),
            projectId: this.ensureSafeSegment(projectId),
            name: entry.name,
            createdAt: info.birthtime.toISOString(),
            updatedAt: info.mtime.toISOString(),
          };
        }),
    );
  }

  async createProjectFile(
    projectId: string,
    fileId: string,
  ): Promise<ProjectFileRecord> {
    const normalizedFileId = this.ensureSafeSegment(fileId);
    const filePath = this.getSceneFilePath(projectId, normalizedFileId);

    await writeFile(filePath, JSON.stringify(EMPTY_SCENE, null, 2));
    const info = await stat(filePath);

    return {
      id: normalizedFileId,
      projectId: this.ensureSafeSegment(projectId),
      name: `${normalizedFileId}.excalidraw`,
      createdAt: info.birthtime.toISOString(),
      updatedAt: info.mtime.toISOString(),
    };
  }

  async readProjectFile(projectId: string, fileId: string) {
    const raw = await readFile(
      this.getSceneFilePath(projectId, fileId),
      "utf8",
    );
    const safeProjectId = this.ensureSafeSegment(projectId);
    const safeFileId = this.ensureSafeSegment(fileId);
    const info = await stat(this.getSceneFilePath(projectId, fileId));

    return {
      file: {
        id: safeFileId,
        projectId: safeProjectId,
        name: `${safeFileId}.excalidraw`,
        createdAt: info.birthtime.toISOString(),
        updatedAt: info.mtime.toISOString(),
      },
      scene: JSON.parse(raw),
    };
  }

  async saveProjectFile(
    projectId: string,
    fileId: string,
    scene: unknown,
  ): Promise<ProjectFileRecord> {
    const filePath = this.getSceneFilePath(projectId, fileId);

    await writeFile(filePath, JSON.stringify(scene, null, 2));
    const info = await stat(filePath);
    const safeProjectId = this.ensureSafeSegment(projectId);
    const safeFileId = this.ensureSafeSegment(fileId);

    return {
      id: safeFileId,
      projectId: safeProjectId,
      name: `${safeFileId}.excalidraw`,
      createdAt: info.birthtime.toISOString(),
      updatedAt: info.mtime.toISOString(),
    };
  }
}
