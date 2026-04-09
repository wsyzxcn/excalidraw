import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from "@nestjs/common";

import { ProjectsService } from "./projects.service";

@Controller("api/projects")
export class ProjectsController {
  constructor(
    @Inject(ProjectsService)
    private readonly projectsService: ProjectsService,
  ) {}

  @Get("health")
  getHealth() {
    return this.projectsService.getHealth();
  }

  @Get()
  async listProjects() {
    return {
      projects: await this.projectsService.listProjects(),
    };
  }

  @Post()
  async createProject(@Body() body: { name: string }) {
    return {
      project: await this.projectsService.createProject(body.name),
    };
  }

  @Get(":projectId/files")
  async listProjectFiles(@Param("projectId") projectId: string) {
    return {
      files: await this.projectsService.listProjectFiles(projectId),
    };
  }

  @Post(":projectId/files")
  async createProjectFile(
    @Param("projectId") projectId: string,
    @Body() body: { name: string },
  ) {
    return {
      file: await this.projectsService.createProjectFile(projectId, body.name),
    };
  }

  @Get(":projectId/files/:fileId")
  async getProjectFile(
    @Param("projectId") projectId: string,
    @Param("fileId") fileId: string,
  ) {
    return this.projectsService.getProjectFile(projectId, fileId);
  }

  @Put(":projectId/files/:fileId")
  async saveProjectFile(
    @Param("projectId") projectId: string,
    @Param("fileId") fileId: string,
    @Body() body: { scene: unknown },
  ) {
    return {
      file: await this.projectsService.saveProjectFile(
        projectId,
        fileId,
        body.scene,
      ),
    };
  }
}
