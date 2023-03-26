import type { Context } from "hono";
import { InternalError } from "../errors/InternalError";

/**
 * Returns the IP address from the given request, using the value of the `CF-Connecting-IP` header.
 *
 * @param arg0 The request context.
 * @returns The IP address.
 * @throws a {@link InternalError} if the `CF-Connecting-IP` header is not set.
 */
export function echo({ req, res }: Context): string {
	// See https://developers.cloudflare.com/fundamentals/get-started/reference/http-request-headers/
	const ip = req.headers.get("CF-Connecting-IP");
	if (!ip) {
		// No IP address found in headers, must be misconfigured
		throw new InternalError(res);
	}

	return ip;
}
