import { headers } from "../headers";

/**
 * @returns a {@link Response} with appropriate CORS headers.
 */
export function cors(): Response {
	// Respond with permissive headers
	return new Response(undefined, { status: 204, headers });
}
