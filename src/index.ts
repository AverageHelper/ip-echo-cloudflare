import type { Env } from "./fetchHandler";
import { about } from "./routes/about";
import { badMethod } from "./helpers/badMethod";
import { badPath } from "./helpers/badPath";
import { cors } from "./helpers/cors";
import { echo } from "./routes/echo";
import { errorHandler as handleErrors } from "./errorHandler";
import { handleGet } from "./fetchHandler";
import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";

const app = new Hono<Env>();

// Routes
handleGet(app, "/", echo);
handleGet(app, "/about", about);

app
	.get("openapi.yaml", serveStatic({ root: ".", path: "./openapi.yaml" }))
	.options(cors)
	.all(badMethod);

app
	.notFound(badPath) // Return 404 for unknown routes
	.onError(handleErrors);

// Cloudflare wants the handler to be a `default` export:
export default app;
