import type { UnstableDevWorker } from "wrangler";
import "jest-extended";
import { repo, title, version } from "./meta";
import { unstable_dev } from "wrangler";

type Response = Awaited<ReturnType<UnstableDevWorker["fetch"]>>;

function expectHeaders(response: Response | globalThis.Response): void {
	expect(response).toHaveProperty("headers");
	expect(response.headers.get("Vary")).toBe("*");
	expect(response.headers.get("Cache-Control")).toBe("no-store");
	expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
	expect(response.headers.get("Access-Control-Allow-Methods")).toInclude("GET");
	expect(response.headers.get("Access-Control-Allow-Methods")).toInclude("HEAD");
	expect(response.headers.get("Access-Control-Allow-Methods")).toInclude("OPTIONS");
	expect(response.headers.get("Access-Control-Allow-Headers")).toInclude("Accept");
	expect(response.headers.get("X-Clacks-Overhead")).toBeString(); // don't care what we put here
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
			vars: { NODE_ENV: "test" }, // match Jest's Node behavior
		});
	});

	afterAll(async () => {
		await worker.stop();
	});

	test("exported handler has routes", async () => {
		const { default: app } = await import("./index");
		expect(app.routes).toBeArrayOfSize(13);
	});

	describe("routing", () => {
		test("returns 404 for unknown route", async () => {
			const res = await worker.fetch(new URL("lolz", url));
			expect(res.headers.get("Content-Type")).toBe("text/plain;charset=UTF-8");
			expect(res.status).toBe(404);
			expectHeaders(res);
		});

		test("sanity test is invisible in prod", async () => {
			// FIXME: Starting another worker like this does weird things on macOS
			const worker = await unstable_dev("src/index.ts", {
				experimental: { disableExperimentalWarning: true },
				port: 60546, // eslint-disable-line unicorn/numeric-separators-style
				// omitting NODE_ENV here
			});
			try {
				const res = await worker.fetch(new URL("failure", url));
				expect(res.headers.get("Content-Type")).toBe("text/plain;charset=UTF-8");
				expect(res.status).toBe(404);
				expect(await res.text()).toBe("Not found\n");
				expectHeaders(res);
			} finally {
				await worker.stop();
			}
		});

		test("returns 500 and text if handler throws unknown error", async () => {
			const res = await worker.fetch(new URL("failure", url));
			expect(res.headers.get("Content-Type")).toBe("text/plain;charset=UTF-8");
			expect(res.status).toBe(500);
			expect(await res.text()).toBe("Internal error\n");
			expectHeaders(res);
		});

		test("returns 500 and JSON if handler throws unknown error", async () => {
			const res = await worker.fetch(new URL("failure", url), {
				headers: { Accept: "application/json" },
			});
			expect(res.headers.get("Content-Type")).toBe("application/json;charset=UTF-8");
			expect(res.status).toBe(500);
			expect(await res.json()).toStrictEqual({ status: 500, message: "Internal error" });
			expectHeaders(res);
		});
	});

	describe("echo", () => {
		test("responds correctly to CORS preflight", async () => {
			const response = await worker.fetch(url, { method: "OPTIONS" });
			expectHeaders(response);
			expect(response.status).toBe(204);
			expect(response.body).toBe(null);
		});

		// See https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods; note that TRACE is not supported
		const BadMethods = ["POST", "PUT", "DELETE", "PATCH"] as const;
		test.each(BadMethods)("responds 405 to %s requests", async method => {
			const response = await worker.fetch(url, { method });
			expectHeaders(response);
			expect(response.status).toBe(405);
			expect(await response.text()).toBe("Not Allowed\n");
		});

		test("GET responds with the caller's IP address", async () => {
			const response = await worker.fetch(url, { headers: { [IP_HEADER_NAME]: TEST_IP } });
			expectHeaders(response);
			expect(response.headers.get("Content-Type")).toBe("text/plain;charset=UTF-8");
			expect(response.status).toBe(200);
			expect(await response.text()).toBe(TEST_IP.concat("\n"));
		});

		test("HEAD responds with appropriate default headers", async () => {
			const response = await worker.fetch(url, {
				method: "HEAD",
				headers: { [IP_HEADER_NAME]: TEST_IP },
			});
			expectHeaders(response);
			expect(response.headers.get("Content-Type")).toBe("text/plain;charset=UTF-8");
			expect(response.status).toBe(200);
			expect(await response.text()).toBe("");
		});

		test("responds with the caller's IP address in JSON", async () => {
			const response = await worker.fetch(url, {
				headers: {
					[IP_HEADER_NAME]: TEST_IP,
					Accept: "application/json",
				},
			});
			expect(response.headers.get("Content-Type")).toBe("application/json;charset=UTF-8");
			expectHeaders(response);
			expect(response.status).toBe(200);
			expect(await response.json()).toBe(TEST_IP);
		});

		test("HEAD responds with appropriate headers", async () => {
			const response = await worker.fetch(url, {
				method: "HEAD",
				headers: {
					[IP_HEADER_NAME]: TEST_IP,
					Accept: "application/json",
				},
			});
			expect(response.headers.get("Content-Type")).toBe("application/json;charset=UTF-8");
			expectHeaders(response);
			expect(response.status).toBe(200);
			expect(await response.text()).toBe("");
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
			expectHeaders(response);
			expect(await response.json()).toStrictEqual({ status: 500, message: "Internal error" });
			expect(response.status).toBe(500);
		});

		test("responds with 404 if the request path is not root", async () => {
			const response = await worker.fetch(new URL("test", url));
			expect(response.headers.get("Content-Type")).toBe("text/plain;charset=UTF-8");
			expectHeaders(response);
			expect(response.status).toBe(404);
			expect(await response.text()).toBe("Not found\n");
		});

		test("responds with 404 and JSON if the Accept header contains 'application/json'", async () => {
			const response = await worker.fetch(new URL("test", url), {
				headers: { Accept: "application/json" },
			});
			expect(response.headers.get("Content-Type")).toBe("application/json;charset=UTF-8");
			expectHeaders(response);
			expect(response.status).toBe(404);
			expect(await response.json()).toStrictEqual({ status: 404, message: "Not found" });
		});
	});

	describe("about", () => {
		test("responds correctly to CORS preflight", async () => {
			const response = await worker.fetch(new URL("about", url), { method: "OPTIONS" });
			expectHeaders(response);
			expect(response.status).toBe(204);
			expect(response.body).toBe(null);
		});

		// See https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods; note that TRACE is not supported
		const BadMethods = ["POST", "PUT", "DELETE", "PATCH"] as const;
		test.each(BadMethods)("responds 405 to %s requests", async method => {
			const response = await worker.fetch(new URL("about", url), { method });
			expectHeaders(response);
			expect(response.status).toBe(405);
			expect(await response.text()).toBe("Not Allowed\n");
		});

		test("responds with appropriate metadata", async () => {
			const response = await worker.fetch(new URL("about", url));
			expect(response.headers.get("Content-Type")).toBe("application/json;charset=UTF-8");
			expectHeaders(response);
			expect(response.status).toBe(200);
			expect(await response.json()).toStrictEqual({ repo, title, version });
		});

		test("HEAD responds with appropriate headers", async () => {
			const response = await worker.fetch(new URL("about", url), { method: "HEAD" });
			expect(response.headers.get("Content-Type")).toBe("application/json;charset=UTF-8");
			expectHeaders(response);
			expect(response.status).toBe(200);
			expect(await response.text()).toStrictEqual("");
		});
	});
});
