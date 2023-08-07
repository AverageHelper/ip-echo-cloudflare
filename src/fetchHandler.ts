/* eslint-disable @typescript-eslint/ban-types */
import type { Context, Hono } from "hono";
import type { Input, Next } from "hono/dist/types/types";
import { badMethod } from "./helpers/badMethod";
import { cors } from "./helpers/cors";
import { headers } from "./headers";

interface Bindings extends Record<string, unknown> {
	NODE_ENV?: string;
}

export interface Env {
	Bindings?: Bindings;
	Variables?: Record<string, unknown>;
}

type Primitive = string | number | boolean;

type Data = Primitive | Array<Primitive> | Record<string, Primitive>;

/**
 * A function that handles a request and provides some data in response.
 */
export type DataProvider<P extends string, I extends Input = {}> = (
	context: Context<Env, P, I>
) => Data | Promise<Data>;

/**
 * A Hono request handler function.
 */
type Handler<P extends string, I extends Input = {}> = (
	context: Context<Env, P, I>,
	next: Next
) => Response | Promise<Response>;

/**
 * Creates a handler function for the given data provider.
 * We could define the handler together in place, but
 * that makes test coverage hard to get.
 *
 * @param provider The data provider.
 * @returns A new request handler that formats the result of
 * the given handler depending on the request context.
 */
export function handlerFor<P extends string, I extends Input = {}>(
	provider: DataProvider<P, I>
): Handler<P, I> {
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
export function headHandlerFor<P extends string, I extends Input = {}>(
	provider: DataProvider<P, I>
): Handler<P, I> {
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
async function fetchHandler<P extends string, I extends Input = {}>(
	context: Context<Env, P, I>,
	provider: DataProvider<P, I>
): Promise<Response> {
	const data: Data = await provider(context);
	const accept = context.req.headers.get("accept");
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

/**
 * Registers a GET endpoint on the given app for the given path,
 * including handlers for HEAD and OPTIONS requests,
 * and handling other methods.
 *
 * @param app The app on which to register the endpoint
 * @param path The path of requests.
 * @param provider The data provider.
 * @returns The modified Hono app.
 */
export function handleGet<P extends string, I extends Input = {}>(
	app: Hono<Env>,
	path: P,
	provider: DataProvider<P, I>
): Hono<Env> {
	return app
		.get(path, handlerFor(provider))
		.head(path, headHandlerFor(provider))
		.options(path, cors)
		.all(path, badMethod);
}
