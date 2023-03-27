import type { Context } from "hono";
import type { Next } from "hono/dist/types/types";
import { headers } from "./headers";

/**
 * A function that handles a request and provides some data in response.
 */
type DataProvider = (c: Context) => unknown | Promise<unknown>;

/**
 * A Hono request handler function.
 */
type Handler = (c: Context, next: Next) => Response | Promise<Response>;

/**
 * Creates a handler function for the given data provider.
 * We could define the handler together in place, but
 * that makes test coverage hard to get.
 *
 * @param provider The data provider.
 * @returns A new request handler that formats the result of
 * the given handler depending on the request context.
 */
export function handlerFor(provider: DataProvider): Handler {
	// Respond with result from handler
	return async c => await fetchHandler(c, provider);
}

/**
 * Creates a handler function for the given data provider.
 * We could define the handler together in place, but
 * that makes test coverage hard to get.
 *
 * Should only be used to handle `HEAD` requests. See
 * [MDN](https://developer.mozilla.org/en-US/docs/web/http/methods/head).
 *
 * @param provider The data provider.
 * @returns A new request handler that responds with only the
 * headers returned by the given handler.
 */
export function headHandlerFor(provider: DataProvider): Handler {
	// Respond with only headers from GET handler
	return async c => {
		const res = await fetchHandler(c, provider);
		return new Response(undefined, { headers: res.headers });
	};
}

/**
 * Runs the given data provider with the given request context,
 * returning a {@link Response} body formatted appropriately according
 * to the request's `Accept` header.
 *
 * @param c The request context.
 * @param provider The data provider.
 * @returns An appropriate `Response` object.
 */
async function fetchHandler(c: Context, provider: DataProvider): Promise<Response> {
	const data = await provider(c);
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
