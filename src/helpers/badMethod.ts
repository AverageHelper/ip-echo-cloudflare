import type { Context } from "hono";
import type { Env } from "../fetchHandler";
import { MethodNotAllowedError } from "../errors/MethodNotAllowedError";

/**
 * @throws a {@link MethodNotAllowedError}.
 */
export function badMethod(context: Context<Env>): never {
	// Other methods are not allowed
	throw new MethodNotAllowedError(context.res);
}
