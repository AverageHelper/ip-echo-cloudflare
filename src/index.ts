import { about } from "./routes/about";
import { badPath } from "./helpers/badPath";
import { echo } from "./routes/echo";
import { errorHandler as handleErrors } from "./errorHandler";
import { handleGet, handlerFor } from "./fetchHandler";
import { Hono } from "hono";
import { InternalError } from "./errors/InternalError";

const app = new Hono();

handleGet(app, "/", echo);
handleGet(app, "/about", about);

// Testing this endpoint involves a special Cloudflare process that doesn't do coverage
/* istanbul ignore next */
app

	// Sanity check that HTTP 500 gets formatted correctly
	.get("/failure", (context, next) => {
		if (context.env?.["NODE_ENV"] === "test") {
			// In test mode, we always throw
			throw new InternalError(context.res);
		}

		// Pretend this is an unknown route
		return handlerFor(badPath)(context, next);
	})

	// 404
	.all("*", badPath)

	.onError(handleErrors);

// Cloudflare wants the endpoint to be a `default` export:
export default app;
