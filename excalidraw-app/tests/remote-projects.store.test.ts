import { describe, expect, it } from "vitest";

import {
  getProjectFilePath,
  getProjectPath,
  getProjectsPath,
  getRemoteProjectRouteState,
  isRemoteProjectFileRoute,
} from "../remote-projects/store";

describe("remote project route state", () => {
  it("parses a file route", () => {
    expect(getRemoteProjectRouteState("/projects/demo/files/homepage")).toEqual(
      {
        mode: "file",
        projectId: "demo",
        fileId: "homepage",
      },
    );
    expect(isRemoteProjectFileRoute("/projects/demo/files/homepage")).toBe(
      true,
    );
  });

  it("creates stable navigation paths", () => {
    expect(getProjectsPath()).toBe("/projects");
    expect(getProjectPath("demo")).toBe("/projects/demo");
    expect(getProjectFilePath("demo", "homepage")).toBe(
      "/projects/demo/files/homepage",
    );
  });
});
