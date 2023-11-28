import type { Context } from "hono";
import type { Env } from "../fetchHandler";
import { InternalError } from "../errors/InternalError";

/**
 * Returns the IP address from the given request, using the value of the `CF-Connecting-IP` header.
 *
 * @param arg0 The request context.
 * @returns The IP address.
 * @throws a {@link InternalError} if the `CF-Connecting-IP` header is not set.
 */
export async function echo(c: Context<Env, "/">): Promise<string> {
	// See https://developers.cloudflare.com/fundamentals/get-started/reference/http-request-headers/
	const ip = c.req.header("CF-Connecting-IP");
	if (!ip) {
		// No IP address found in headers, must be misconfigured
		throw new InternalError();
	}

	// There's no real "reason" to use a Promise here; it's only to test `async` support upstream:
	return await Promise.resolve(ip);
}
