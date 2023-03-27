import { InternalError } from "./InternalError";

export class NotFoundError extends InternalError {
	constructor(res: Response) {
		super(res, 404, "Not found");
		this.name = "NotFoundError";
	}
}
