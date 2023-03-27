import type { Context } from "hono";
import { headers } from "./headers";
import { HTTPException } from "hono/http-exception";
import { InternalError } from "./errors/InternalError";

/**
 * Handles the given error according to the given context.
 *
 * @param error_ The thrown error.
 * @param c The request context.
 * @returns a {@link Response} formatted appropriately according to the request's `Accept` header.
 */
export function errorHandler(error_: Error, c: Context): Response {
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
}
