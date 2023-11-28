import type { Env } from "./fetchHandler";
import { about } from "./routes/about";
import { badPath } from "./helpers/badPath";
import { echo } from "./routes/echo";
import { errorHandler as handleErrors } from "./errorHandler";
import { handleGet } from "./fetchHandler";
import { Hono } from "hono";

const app = new Hono<Env>();

// Routes
handleGet(app, "/", echo);
handleGet(app, "/about", about);

app
	.notFound(badPath) // Return 404 for unknown routes
	.onError(handleErrors);

// Cloudflare wants the handler to be a `default` export:
export default app;
