import { InternalError } from "./InternalError";

export class NotFoundError extends InternalError {
	constructor() {
		super(404, "Not found");
		this.name = "NotFoundError";
	}
}
