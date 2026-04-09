import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import {
  createProjectDirectory,
  createProjectSceneFile,
  listProjectDirectories,
  listProjectFiles,
  readProjectSceneFile,
  saveProjectSceneFile,
} from "./projects";

import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect, Plugin } from "vite";

const PROJECTS_PREFIX = "/api/projects";

const sendJson = (
  res: ServerResponse,
  status: number,
  payload: Record<string, unknown>,
) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
};

const readBody = async (req: IncomingMessage) => {
  const chunks: Uint8Array[] = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  if (!chunks.length) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<
    string,
    unknown
  >;
};

const getRootDir = async () => {
  const root =
    process.env.EXCALIDRAW_PROJECTS_ROOT ||
    resolve(process.cwd(), "..", "data", "projects");

  await mkdir(root, { recursive: true });
  return root;
};

const normalizeErrorStatus = (error: unknown) => {
  if (error instanceof Error) {
    if (error.message.includes("Invalid path segment")) {
      return 400;
    }
    if ("code" in error && error.code === "EEXIST") {
      return 409;
    }
    if ("code" in error && error.code === "ENOENT") {
      return 404;
    }
  }

  return 500;
};

const handleProjectsRequest = async (
  req: IncomingMessage,
  res: ServerResponse,
) => {
  const root = await getRootDir();
  const url = new URL(req.url || PROJECTS_PREFIX, "http://localhost");
  const pathname = url.pathname.replace(/\/$/, "");
  const parts = pathname
    .slice(PROJECTS_PREFIX.length)
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent);

  if (parts.length === 0 && req.method === "GET") {
    const projects = await listProjectDirectories(root);
    return sendJson(res, 200, { projects });
  }

  if (parts.length === 0 && req.method === "POST") {
    const body = await readBody(req);
    const project = await createProjectDirectory(root, String(body.name || ""));
    return sendJson(res, 200, { project });
  }

  if (parts.length === 2 && parts[1] === "files" && req.method === "GET") {
    const files = await listProjectFiles(root, parts[0]);
    return sendJson(res, 200, { files });
  }

  if (parts.length === 2 && parts[1] === "files" && req.method === "POST") {
    const body = await readBody(req);
    const file = await createProjectSceneFile(
      root,
      parts[0],
      String(body.name || ""),
    );
    return sendJson(res, 200, { file });
  }

  if (parts.length === 3 && parts[1] === "files" && req.method === "GET") {
    const payload = await readProjectSceneFile(root, parts[0], parts[2]);
    return sendJson(res, 200, payload);
  }

  if (parts.length === 3 && parts[1] === "files" && req.method === "PUT") {
    const body = await readBody(req);
    await saveProjectSceneFile(root, parts[0], parts[2], body.scene || {});
    const payload = await readProjectSceneFile(root, parts[0], parts[2]);
    return sendJson(res, 200, { file: payload.file });
  }

  return sendJson(res, 404, { error: "Not found" });
};

const middleware: Connect.NextHandleFunction = async (req, res, next) => {
  if (!req.url?.startsWith(PROJECTS_PREFIX)) {
    return next();
  }

  try {
    await handleProjectsRequest(req, res);
  } catch (error) {
    const status = normalizeErrorStatus(error);
    sendJson(res, status, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const viteRemoteProjectsApi = (): Plugin => ({
  name: "vite-remote-projects-api",
  configureServer(server) {
    server.middlewares.use(middleware);
  },
});
