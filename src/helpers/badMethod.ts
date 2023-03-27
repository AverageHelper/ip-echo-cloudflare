import type { Context } from "hono";
import { MethodNotAllowedError } from "../errors/MethodNotAllowedError";

/**
 * @throws a {@link MethodNotAllowedError}.
 */
export function badMethod(c: Context): never {
	// Other methods are not allowed
	throw new MethodNotAllowedError(c.res);
}
