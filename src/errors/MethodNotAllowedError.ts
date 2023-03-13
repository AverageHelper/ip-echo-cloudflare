import { InternalError } from "./InternalError";

export class MethodNotAllowedError extends InternalError {
	constructor() {
		super(405, "");
		this.name = "MethodNotAllowedError";
	}
}
