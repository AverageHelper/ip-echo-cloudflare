import type { Env } from "./fetchHandler";
import { about } from "./routes/about";
import { badPath } from "./helpers/badPath";
import { echo } from "./routes/echo";
import { errorHandler as handleErrors } from "./errorHandler";
import { handleGet } from "./fetchHandler";
import { Hono } from "hono";
import { InternalError } from "./errors/InternalError";

const app = new Hono<Env>();

// Routes
handleGet(app, "/", echo);
handleGet(app, "/about", about);

// Sanity check that HTTP 500 gets formatted correctly
// Testing this endpoint involves a special Cloudflare process that doesn't do coverage
handleGet(
	app,
	"/failure",
	/* istanbul ignore next */ context => {
		if (context.env?.NODE_ENV === "test") {
			// In test mode, we always throw
			throw new InternalError(context.res);
		}

		// Pretend this is an unknown route
		return badPath(context);
	}
);

app
	.all("*", badPath) // Return 404 for unknown routes
	.onError(handleErrors);

// Cloudflare wants the endpoint to be a `default` export:
export default app;
