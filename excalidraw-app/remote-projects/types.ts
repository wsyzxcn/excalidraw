import type { BinaryFiles, AppState } from "@excalidraw/excalidraw/types";
import type { OrderedExcalidrawElement } from "@excalidraw/element/types";

export type RemoteProject = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RemoteProjectFile = {
  id: string;
  projectId: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RemoteProjectScene = {
  elements: readonly OrderedExcalidrawElement[];
  appState: AppState;
  files: BinaryFiles;
};
