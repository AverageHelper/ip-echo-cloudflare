import type { StatusCode } from "hono/utils/http-status";
import { HTTPException } from "hono/http-exception";

export class InternalError extends HTTPException {
	constructor(res: Response, status: StatusCode = 500, message: string = "Internal error") {
		super(status, { message, res });
		this.name = "InternalError";
	}
}
