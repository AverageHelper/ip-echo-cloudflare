import { fetchHandler as fetch } from "fetchHandler";

// Testing this involves a special Cloudflare process that doesn't do coverage
/* istanbul ignore next */
const handlers: ExportedHandler = {
	fetch,
};

// Cloudflare wants the endpoint to be a `default` export:
export default handlers;
