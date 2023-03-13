import { assertValidMethod } from "./Router";
import { headers } from "./headers";
import { InternalError } from "./errors/InternalError";
import { MethodNotAllowedError } from "./errors/MethodNotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";
import { routes } from "./routes";

export function fetchHandler(req: Request): Response {
	try {
		const url = new URL(req.url);

		// Figure out what path we're aiming for
		const route = routes[url.pathname];
		if (!route) throw new NotFoundError();

		// Figure out what method we're aiming for
		const method = req.method.toUpperCase();
		assertValidMethod(method);

		// Handle CORS preflight
		if (method === "OPTIONS") {
			// TODO: Give appropriate 'Access-Control-Allow-Methods' for the route
			return new Response(undefined, { status: 204, headers });
		}

		// Get the method's handler
		const handler = route[method];
		if (!handler) throw new MethodNotAllowedError();

		const data = handler(req);

		// Respond with the requested data, according to the Accept header
		const accept = req.headers.get("accept");
		let message: string;
		let contentType: string;

		if (accept?.includes("application/json") || typeof data === "object") {
			message = JSON.stringify(data);
			contentType = "application/json";
		} else {
			message = typeof data === "string" ? data : JSON.stringify(data);
			contentType = "text/plain";
		}

		return new Response(message.concat("\n"), {
			status: 200,
			headers: { ...headers, "Content-Type": contentType },
		});
	} catch (error_) {
		let error: InternalError;
		if (error_ instanceof InternalError) {
			error = error_;
		} else {
			error = new InternalError();
		}

		const status = error.status;
		const data = { status, message: error.message };

		// Respond with the error, according to the Accept header
		const accept = req.headers.get("accept");
		let message: string;
		let contentType: string;

		if (accept?.includes("application/json")) {
			message = JSON.stringify(data);
			contentType = "application/json";
		} else {
			message = error.message;
			contentType = "text/plain";
		}

		// Append newline if not an empty string
		if (message) {
			message = message.concat("\n");
		}

		return new Response(message, {
			status,
			headers: { ...headers, "Content-Type": contentType },
		});
	}
}
