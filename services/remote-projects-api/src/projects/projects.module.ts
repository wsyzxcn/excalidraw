import { Module } from "@nestjs/common";

import { ProjectsController } from "./projects.controller";
import { ProjectsFilesystemService } from "./projects-filesystem.service";
import { ProjectsService } from "./projects.service";

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectsFilesystemService],
})
export class ProjectsModule {}
