import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { ProjectsFilesystemService } from "./projects-filesystem.service";

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(ProjectsFilesystemService)
    private readonly projectsFilesystemService: ProjectsFilesystemService,
  ) {}

  getHealth() {
    return {
      ok: true,
      root: this.projectsFilesystemService.getConfiguredRoot(),
    };
  }

  async listProjects() {
    return this.projectsFilesystemService.listProjects();
  }

  async createProject(name: string) {
    try {
      return await this.projectsFilesystemService.createProject(name);
    } catch (error) {
      throw this.mapFilesystemError(error);
    }
  }

  async listProjectFiles(projectId: string) {
    try {
      return await this.projectsFilesystemService.listProjectFiles(projectId);
    } catch (error) {
      throw this.mapFilesystemError(error);
    }
  }

  async createProjectFile(projectId: string, fileId: string) {
    try {
      return await this.projectsFilesystemService.createProjectFile(
        projectId,
        fileId,
      );
    } catch (error) {
      throw this.mapFilesystemError(error);
    }
  }

  async getProjectFile(projectId: string, fileId: string) {
    try {
      return await this.projectsFilesystemService.readProjectFile(
        projectId,
        fileId,
      );
    } catch (error) {
      throw this.mapFilesystemError(error);
    }
  }

  async saveProjectFile(projectId: string, fileId: string, scene: unknown) {
    try {
      return await this.projectsFilesystemService.saveProjectFile(
        projectId,
        fileId,
        scene,
      );
    } catch (error) {
      throw this.mapFilesystemError(error);
    }
  }

  private mapFilesystemError(error: unknown) {
    if (error instanceof Error && error.message === "Invalid path segment") {
      return new BadRequestException(error.message);
    }

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "EEXIST"
    ) {
      return new ConflictException("Resource already exists");
    }

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return new NotFoundException("Resource not found");
    }

    throw error;
  }
}
