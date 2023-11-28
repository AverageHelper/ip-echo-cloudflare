import type { Context } from "hono";
import type { Env } from "./fetchHandler";
import { headers } from "./headers";
import { InternalError } from "./errors/InternalError";

/**
 * Handles the given error according to the given context.
 *
 * @param error An error to return to the client.
 * @param c The request context.
 * @returns a {@link Response} formatted appropriately according to the request's `Accept` header.
 */
export function errorHandler(error: Error, c: Context<Env, string>): Response {
	let err: InternalError;

	if (error instanceof InternalError) {
		err = error;
	} else {
		// eslint-disable-next-line no-console
		console.error(error);
		err = new InternalError();
	}

	const status = err.status;
	const data = { status, message: err.message };

	// Respond with the error, according to the Accept header
	const accept = c.req.header("accept");
	let message: string;
	let contentType: string;

	if (accept?.includes("application/json")) {
		message = JSON.stringify(data);
		contentType = "application/json";
	} else {
		message = err.message;
		contentType = "text/plain";
	}

	// Append newline if not an empty string
	if (message) {
		message = message.concat("\n");
	}

	return c.text(message, status, { ...headers, "Content-Type": `${contentType};charset=UTF-8` });
}
