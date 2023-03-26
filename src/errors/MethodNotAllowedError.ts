import { InternalError } from "./InternalError";

export class MethodNotAllowedError extends InternalError {
	constructor(res: Response) {
		super(res, 405, "");
		this.name = "MethodNotAllowedError";
	}
}
