import type { Context } from "hono";
import type { Env } from "../fetchHandler";
import { NotFoundError } from "../errors/NotFoundError";

/**
 * @throws a {@link NotFoundError}.
 */
export function badPath(context: Context<Env>): never {
	// Unknown route
	throw new NotFoundError(context.res);
}
