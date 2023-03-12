import type { UnstableDevWorker } from "wrangler";
import "jest-extended";
import { unstable_dev } from "wrangler";

describe("IP Echo", () => {
	const url = new URL("https://localhost/");
	const IP_HEADER_NAME = "CF-Connecting-IP";
	const TEST_IP = "::ffff:127.0.0.1";

	let worker: UnstableDevWorker;

	beforeAll(async () => {
		// `beforeEach` would spam macOS testers with "Can Node use the network?" prompts
		worker = await unstable_dev("src/index.ts", {
			experimental: { disableExperimentalWarning: true },
		});
	});

	afterAll(async () => {
		await worker.stop();
	});

	test("responds correctly to CORS preflight", async () => {
		const response = await worker.fetch(url, { method: "OPTIONS" });
		expect(response).toHaveProperty("headers");
		expect(response.headers.get("Vary")).toBe("*");
		expect(response.headers.get("Cache-Control")).toBe("no-store");
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(response.headers.get("Access-Control-Allow-Methods")).toInclude("GET");
		expect(response.headers.get("Access-Control-Allow-Headers")).toInclude("Accept");
		expect(response.status).toBe(204);
		expect(response.body).toBe(null);
	});

	// See https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods; note that TRACE is not supported
	const BadMethods = ["HEAD", "POST", "PUT", "DELETE", "PATCH"] as const;
	test.each(BadMethods)("responds 405 to %s requests", async method => {
		const response = await worker.fetch(url, { method });
		expect(response).toHaveProperty("headers");
		expect(response.headers.get("Vary")).toBe("*");
		expect(response.headers.get("Cache-Control")).toBe("no-store");
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(response.headers.get("Access-Control-Allow-Methods")).toInclude("GET");
		expect(response.headers.get("Access-Control-Allow-Headers")).toInclude("Accept");
		expect(response.status).toBe(405);
		expect(await response.text()).toBe("");
	});

	test("responds with the caller's IP address", async () => {
		const response = await worker.fetch(url, { headers: { [IP_HEADER_NAME]: TEST_IP } });
		expect(response).toHaveProperty("headers");
		expect(response.headers.get("Vary")).toBe("*");
		expect(response.headers.get("Cache-Control")).toBe("no-store");
		expect(response.headers.get("Content-Type")).toBe("text/plain");
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(response.headers.get("Access-Control-Allow-Methods")).toInclude("GET");
		expect(response.headers.get("Access-Control-Allow-Headers")).toInclude("Accept");
		expect(response.status).toBe(200);
		expect(await response.text()).toBe(TEST_IP.concat("\n"));
	});

	test("responds with the caller's IP address in JSON", async () => {
		const response = await worker.fetch(url, {
			headers: {
				[IP_HEADER_NAME]: TEST_IP,
				Accept: "application/json",
			},
		});
		expect(response).toHaveProperty("headers");
		expect(response.headers.get("Vary")).toBe("*");
		expect(response.headers.get("Cache-Control")).toBe("no-store");
		expect(response.headers.get("Content-Type")).toBe("application/json");
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(response.headers.get("Access-Control-Allow-Methods")).toInclude("GET");
		expect(response.headers.get("Access-Control-Allow-Headers")).toInclude("Accept");
		expect(response.status).toBe(200);
		expect(await response.json()).toBe(TEST_IP);
	});

	test("responds with 500 if there is no 'CF-Connecting-IP' header", async () => {
		// Only happens if the server is configured to not receive IP addresses
		// See https://developers.cloudflare.com/fundamentals/get-started/reference/http-request-headers/
		const response = await worker.fetch(url, {
			headers: {
				[IP_HEADER_NAME]: "",
				Accept: "application/json",
			},
		});
		expect(await response.text()).toBe("");
		expect(response.status).toBe(500);
	});

	test("responds with 404 if the request path is not root", async () => {
		const response = await worker.fetch(new URL("test", url));
		expect(response.status).toBe(404);
		expect(await response.text()).toBe("");
	});

	// TODO: Test that it responds with 500 if the request is to an invalid URL (should never happen, but we catch it anyway)
});
