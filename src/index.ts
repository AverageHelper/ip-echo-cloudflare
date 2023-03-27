import { about } from "./routes/about";
import { badMethod } from "./helpers/badMethod";
import { badPath } from "./helpers/badPath";
import { cors } from "./helpers/cors";
import { echo } from "./routes/echo";
import { errorHandler as handleErrors } from "./errorHandler";
import { errorSanity } from "./routes/errorSanity";
import { handlerFor, headFor } from "./fetchHandler";
import { Hono } from "hono";

// Testing this file involves a special Cloudflare process that doesn't do coverage
/* istanbul ignore next */
const app = new Hono()

	// Echo
	.get("/", handlerFor(echo))
	.head("/", headFor(echo))
	.options("/", cors)
	.all("/", badMethod)

	// About
	.get("/about", handlerFor(about))
	.head("/about", headFor(about))
	.options("/about", cors)
	.all("/about", badMethod)

	// Sanity check that HTTP 500 gets formatted correctly
	.get("/test-error", (c, next) => {
		if (c.env?.["NODE_ENV"] === "test") {
			// In test mode, we always throw
			return handlerFor(errorSanity)(c, next);
		}

		// Pretend this is an unknown route
		// return handle(c, badPath);
		return handlerFor(badPath)(c, next);
	})

	// 404
	.all("*", badPath)

	.onError(handleErrors);

// Cloudflare wants the endpoint to be a `default` export:
export default app;
