import type { Context } from "hono";
import { about } from "./routes/about";
import { echo } from "./routes/echo";
import { errorSanity } from "./routes/errorSanity";
import { headers } from "./headers";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { InternalError } from "./errors/InternalError";
import { MethodNotAllowedError } from "./errors/MethodNotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";

// FIXME: Tests show no coverage here because Cloudflare's runner doesn't do that. Abstract out enough that we can properly test (?)

export const app = new Hono() // exported for testing

	// Echo
	.get("/", c => handle(c, echo))
	.head("/", c => {
		// Respond with only headers from GET
		const res = handle(c, echo);
		return new Response(undefined, { headers: res.headers });
	})
	.options("/", () => {
		// Respond with permissive headers
		return new Response(undefined, { status: 204, headers });
	})
	.all("/", c => {
		// Other methods are not allowed
		throw new MethodNotAllowedError(c.res);
	})

	// About
	.get("/about", c => handle(c, about))
	.head("/about", c => {
		// Respond with only headers from GET
		const res = handle(c, about);
		return new Response(undefined, { headers: res.headers });
	})
	.options("/about", () => {
		// Respond with permissive headers
		return new Response(undefined, { status: 204, headers });
	})
	.all("/about", c => {
		// Other methods are not allowed
		throw new MethodNotAllowedError(c.res);
	})

	.get("/test-error", c => {
		if (c.env?.["NODE_ENV"] === "test") {
			// In test mode, we always throw
			return handle(c, errorSanity);
		}

		// Pretend this is an unknown route
		throw new NotFoundError(c.res);
	})

	// 404
	.all("*", c => {
		// Unknown route
		throw new NotFoundError(c.res);
	})

	.onError((error_, c) => {
		let error: HTTPException;
		if (error_ instanceof HTTPException) {
			error = error_;
		} else {
			error = new InternalError(c.res);
		}

		const status = error.status;
		const data = { status, message: error.message };

		// Respond with the error, according to the Accept header
		const accept = c.req.headers.get("accept");
		let message: string;
		let contentType: string;

		if (accept?.includes("application/json")) {
			message = JSON.stringify(data);
			contentType = "application/json";
		} else {
			message = error.message;
			contentType = "text/plain";
		}

		// Append newline if not an empty string
		if (message) {
			message = message.concat("\n");
		}

		return new Response(message, {
			status,
			headers: { ...headers, "Content-Type": `${contentType};charset=UTF-8` },
		});
	});

type Handler = (c: Context) => unknown;

function handle(c: Context, handler: Handler): Response {
	const data = handler(c);
	const accept = c.req.headers.get("accept");
	let message: string;
	let contentType: string;

	if (accept?.includes("application/json") || typeof data === "object") {
		message = JSON.stringify(data);
		contentType = "application/json";
	} else {
		message = typeof data === "string" ? data : JSON.stringify(data);
		contentType = "text/plain";
	}

	return new Response(message.concat("\n"), {
		status: 200,
		headers: { ...headers, "Content-Type": `${contentType};charset=UTF-8` },
	});
}

// Cloudflare wants the endpoint to be a `default` export:
export default app;
