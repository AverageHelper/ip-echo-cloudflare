import type { UnstableDevWorker } from "wrangler";
import "jest-extended";
import { unstable_dev } from "wrangler";
import { repo, title, version } from "./meta";

type Response = Awaited<ReturnType<UnstableDevWorker["fetch"]>>;

function expectHeaders(response: Response): void {
	expect(response).toHaveProperty("headers");
	expect(response.headers.get("Vary")).toBe("*");
	expect(response.headers.get("Cache-Control")).toBe("no-store");
	expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
	expect(response.headers.get("Access-Control-Allow-Methods")).toInclude("GET");
	expect(response.headers.get("Access-Control-Allow-Headers")).toInclude("Accept");
}

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

	// TODO: Mock `import { fetchHandler as fetch } from "fetchHandler";` so we don't duplicate tests here
	describe("echo", () => {
		test("responds correctly to CORS preflight", async () => {
			const response = await worker.fetch(url, { method: "OPTIONS" });
			expectHeaders(response);
			expect(response.status).toBe(204);
			expect(response.body).toBe(null);
		});

		// See https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods; note that TRACE is not supported
		const BadMethods = ["HEAD", "POST", "PUT", "DELETE", "PATCH"] as const;
		test.each(BadMethods)("responds 405 to %s requests", async method => {
			const response = await worker.fetch(url, { method });
			expectHeaders(response);
			expect(response.status).toBe(405);
			expect(await response.text()).toBe("");
		});

		test("responds with the caller's IP address", async () => {
			const response = await worker.fetch(url, { headers: { [IP_HEADER_NAME]: TEST_IP } });
			expect(response.headers.get("Content-Type")).toBe("text/plain");

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
			expect(response.headers.get("Content-Type")).toBe("application/json");
			expectHeaders(response);
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
			expect(await response.json()).toStrictEqual({ status: 500, message: "Internal error" });
			expect(response.status).toBe(500);
		});

		test("responds with 404 if the request path is not root", async () => {
			const response = await worker.fetch(new URL("test", url));
			expect(response.headers.get("Content-Type")).toBe("text/plain");
			expectHeaders(response);
			expect(response.status).toBe(404);
			expect(await response.text()).toBe("Not found\n");
		});

		test("responds with 404 and JSON if the Accept header contains 'application/json'", async () => {
			const response = await worker.fetch(new URL("test", url), {
				headers: { Accept: "application/json" },
			});
			expect(response.headers.get("Content-Type")).toBe("application/json");
			expectHeaders(response);
			expect(response.status).toBe(404);
			expect(await response.json()).toStrictEqual({ status: 404, message: "Not found" });
		});

		// TODO: Test that it responds with 500 if the request is to an invalid URL (should never happen, but we catch it anyway)
	});

	describe("about", () => {
		test("responds with appropriate metadata", async () => {
			const response = await worker.fetch(new URL("about", url));
			expect(response.headers.get("Content-Type")).toBe("application/json");
			expectHeaders(response);
			expect(response.status).toBe(200);
			expect(await response.json()).toStrictEqual({ repo, title, version });
		});
	});
});
