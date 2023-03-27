import type { Context } from "hono";
import type { Next } from "hono/dist/types/types";
import { headers } from "./headers";

type Handler = (c: Context) => unknown;

type _Handler = (c: Context, next: Next) => Response | Promise<Response /*| TypedResponse<O>*/>; // | TypedResponse<O>;

/**
 * Creates a handler function for the given handler.
 * We could define the handler together in place, but
 * that makes test coverage hard to get.
 *
 * @param handler The request handler.
 * @returns A new request handler that formats the result of
 * the given handler depending on the request context.
 */
export function handlerFor(handler: Handler): _Handler {
	// Respond with result from handler
	return c => fetchHandler(c, handler);
}

/**
 * Creates a handler function for the given handler.
 * We could define the handler together in place, but
 * that makes test coverage hard to get.
 *
 * Should only be used to handle `HEAD` requests. See
 * [MDN](https://developer.mozilla.org/en-US/docs/web/http/methods/head).
 *
 * @param handler The request handler.
 * @returns A new request handler that responds with only the
 * headers returned by the given handler.
 */
export function headFor(handler: Handler): _Handler {
	// Respond with only headers from GET handler
	return c => {
		const res = fetchHandler(c, handler);
		return new Response(undefined, { headers: res.headers });
	};
}

/**
 * Runs the given `handler` with the given context, returning a {@link Response}
 * formatted appropriately according to the request's `Accept` header.
 *
 * @param c The request context.
 * @param handler The request handler.
 * @returns An appropriate `Response` object.
 */
function fetchHandler(c: Context, handler: Handler): Response {
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
