import { InternalError } from "./InternalError";

export class MethodNotAllowedError extends InternalError {
	constructor() {
		super(405, "Not Allowed");
		this.name = "MethodNotAllowedError";
	}
}
