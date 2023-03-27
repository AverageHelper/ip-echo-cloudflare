import type { Context } from "hono";
import { NotFoundError } from "../errors/NotFoundError";

/**
 * @throws a {@link NotFoundError}.
 */
export function badPath(c: Context): never {
	// Unknown route
	throw new NotFoundError(c.res);
}
