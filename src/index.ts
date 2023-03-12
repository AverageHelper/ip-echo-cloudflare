function echo(req: Request): Response {
	// See https://developers.cloudflare.com/fundamentals/get-started/reference/http-request-headers/
	const ip = req.headers.get("CF-Connecting-IP");
	if (!ip) {
		// No IP address found in headers, must be misconfigured
		return new Response(undefined, { status: 500, headers });
	}

	// Found IP, respond the way the caller wants us to:
	const accept = req.headers.get("accept");
	let message = ip;
	let contentType = "text/plain";

	if (accept?.includes("application/json")) {
		message = JSON.stringify(ip);
		contentType = "application/json";
	}

	return new Response(message.concat("\n"), {
		status: 200,
		headers: { ...headers, "Content-Type": contentType },
	});
}

// Common headers:
const headers = {
	Vary: "*", // See https://stackoverflow.com/a/54337073 for why "Vary: *" is necessary for Safari
	"Cache-Control": "no-store",
	"X-Clacks-Overhead": "GNU Terry Pratchett",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers": "Accept, Content-Length, Content-Type, Date",
	"Access-Control-Allow-Origin": "*",
};

// Cloudflare wants the endpoint to be a `default` export:
const handlers: ExportedHandler = {
	fetch(req) {
		// Figure out what path we're aiming for
		let url: URL;
		try {
			url = new URL(req.url);
		} catch {
			// This should never happen
			return new Response(undefined, { status: 500, headers });
		}

		if (url.pathname !== "/") return new Response(undefined, { status: 404, headers });

		switch (req.method.toUpperCase()) {
			// Normal requests:
			case "GET":
				return echo(req);

			// CORS preflight:
			case "OPTIONS":
				return new Response(undefined, { status: 204, headers });

			// Everything else:
			default:
				return new Response(undefined, { status: 405, headers });
		}
	},
};

export default handlers;
