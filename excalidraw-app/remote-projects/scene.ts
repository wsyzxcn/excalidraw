import type { AppState } from "@excalidraw/excalidraw/types";

import type { RemoteProjectScene } from "./types";

export const deserializeRemoteProjectScene = (
  scene: RemoteProjectScene,
): RemoteProjectScene => ({
  ...scene,
  appState: {
    ...scene.appState,
    collaborators:
      scene.appState.collaborators instanceof Map
        ? scene.appState.collaborators
        : new Map(),
  },
});

export const serializeRemoteProjectScene = (
  scene: RemoteProjectScene,
): RemoteProjectScene => {
  const { collaborators: _collaborators, ...appState } =
    scene.appState as AppState & {
      collaborators?: unknown;
    };

  return {
    ...scene,
    appState: appState as AppState,
  };
};
