export class InternalError extends Error {
	readonly status: number;

	constructor(status: number = 500, message: string = "Internal error") {
		super(message);
		this.name = "InternalError";
		this.status = status;
	}
}
