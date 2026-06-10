import fs from "node:fs/promises";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const DEFAULT_RESUME_ROUTE = "/api/default-resume";
const DEFAULT_RESUME_FILES = {
  en: path.resolve(__dirname, "saved_info", "default-resume.json"),
  es: path.resolve(
    __dirname,
    "saved_info",
    "curriculum-por-defecto-espanol.json",
  ),
} as const;

const normalizeTemplateLanguage = (language?: string) =>
  language === "es" ? "es" : "en";

const getDefaultResumeFile = (language?: string) =>
  DEFAULT_RESUME_FILES[normalizeTemplateLanguage(language)];

const getResumeSlug = (resume: unknown) => {
  if (
    !resume ||
    typeof resume !== "object" ||
    !("name" in resume) ||
    typeof resume.name !== "string"
  ) {
    return "resume";
  }

  const normalizedName = resume.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalizedName || "resume";
};

const getNamedResumeFile = (resume: unknown) =>
  path.resolve(
    __dirname,
    "saved_info",
    `personal_resume_builder_${getResumeSlug(resume)}.json`,
  );

const sendJson = (
  res: ServerResponse,
  statusCode: number,
  payload: unknown,
) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
};

const readRequestBody = (req: IncomingMessage) =>
  new Promise<string>((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });

const defaultResumePlugin = (): Plugin => {
  const handleRequest = async (
    req: IncomingMessage,
    res: ServerResponse,
    next: Connect.NextFunction,
  ) => {
    if (!req.url?.startsWith(DEFAULT_RESUME_ROUTE)) {
      next();
      return;
    }

    const requestUrl = new URL(req.url, "http://localhost");
    const templateLanguage = normalizeTemplateLanguage(
      requestUrl.searchParams.get("language") ?? undefined,
    );
    const defaultResumeFile = getDefaultResumeFile(templateLanguage);

    if (req.method === "GET") {
      try {
        const raw = await fs.readFile(defaultResumeFile, "utf8");
        const resume = JSON.parse(raw) as Record<string, unknown> | null;

        sendJson(res, 200, {
          resume:
            resume && typeof resume === "object"
              ? {
                  templateLanguage,
                  ...resume,
                }
              : resume,
        });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          sendJson(res, 200, { resume: null });
          return;
        }

        sendJson(res, 500, {
          error: "Unable to read the saved default resume.",
        });
      }

      return;
    }

    if (req.method === "POST") {
      try {
        const rawBody = await readRequestBody(req);
        const payload = JSON.parse(rawBody) as { resume?: unknown };
        const namedResumeFile = getNamedResumeFile(payload.resume);

        await fs.mkdir(path.dirname(defaultResumeFile), { recursive: true });
        await fs.writeFile(
          defaultResumeFile,
          JSON.stringify(payload.resume ?? null, null, 2),
          "utf8",
        );
        await fs.writeFile(
          namedResumeFile,
          JSON.stringify(payload.resume ?? null, null, 2),
          "utf8",
        );

        sendJson(res, 200, {
          ok: true,
          fileName: path.basename(namedResumeFile),
        });
      } catch {
        sendJson(res, 500, {
          error: "Unable to save the default resume.",
        });
      }

      return;
    }

    sendJson(res, 405, { error: "Method not allowed." });
  };

  return {
    name: "default-resume-storage",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        void handleRequest(req, res, next);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        void handleRequest(req, res, next);
      });
    },
  };
};

export default defineConfig({
  plugins: [react(), defaultResumePlugin()],
});
