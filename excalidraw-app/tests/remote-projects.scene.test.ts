import { describe, expect, it } from "vitest";

import { serializeRemoteProjectScene } from "../remote-projects/scene";

describe("remote project scene serialization", () => {
  it("omits runtime-only collaborators data from saved app state", () => {
    const scene = serializeRemoteProjectScene({
      elements: [],
      appState: {
        collaborators: new Map([["socket-1", { username: "A" }]]),
      } as any,
      files: {},
    });

    expect(scene.appState.collaborators).toBeUndefined();
  });
});
