import type { Context, Env } from "hono";
import { headers } from "../headers";

/**
 * @returns a {@link Response} with appropriate CORS headers.
 */
export function cors(c: Context<Env>): Response {
	// Respond with permissive headers
	return c.newResponse(null, 204, headers);
}
