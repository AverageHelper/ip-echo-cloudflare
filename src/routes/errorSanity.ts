import type { Context } from "hono";
import { InternalError } from "../errors/InternalError";

/**
 * Used only in testing.
 * @throws a {@link InternalError} in all cases.
 */
export function errorSanity({ res }: Context): never {
	throw new InternalError(res);
}
