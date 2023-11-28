import type { Env } from "./fetchHandler";
import { about } from "./routes/about";
import { badMethod } from "./helpers/badMethod";
import { badPath } from "./helpers/badPath";
import { cors } from "./helpers/cors";
import { echo } from "./routes/echo";
import { errorHandler as handleErrors } from "./errorHandler";
import { handleGet } from "./fetchHandler";
import { headers } from "./headers";
import { Hono } from "hono";
import { NotFoundError } from "./errors/NotFoundError";
import { serveStatic } from "hono/cloudflare-workers";

const app = new Hono<Env>();

// Routes
handleGet(app, "/", echo);
handleGet(app, "/about", about);

// TODO: Clean this up
app
	.get("openapi.yaml", async c => {
		const next = async (): Promise<void> => await Promise.resolve();
		const res = await serveStatic({ root: ".", path: "./openapi.yaml" })(c, next);
		if (!res) throw new NotFoundError();
		return c.text(await res.text(), 200, {
			...headers,
			"Content-Type": "application/x-yaml;charset=UTF-8",
		});
	})
	.options(cors)
	.all(badMethod);

app
	.notFound(badPath) // Return 404 for unknown routes
	.onError(handleErrors);

// Cloudflare wants the handler to be a `default` export:
export default app;
