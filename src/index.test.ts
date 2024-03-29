import type { Env } from "./fetchHandler";
import type { Hono } from "hono";
import type { serveStatic } from "hono/cloudflare-workers";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { repo, title, version } from "./meta";

const { mockServeStatic } = vi.hoisted(() => ({
	mockServeStatic: vi.fn<Parameters<typeof serveStatic>, ReturnType<typeof serveStatic>>(),
}));
vi.mock("hono/cloudflare-workers", () => ({
	serveStatic: mockServeStatic,
}));

function expectHeaders(res: Response | globalThis.Response): void {
	expect(res).toHaveProperty("headers");
	expect(res.headers.get("Vary")).toBe("*");
	expect(res.headers.get("Cache-Control")).toBe("no-store");
	expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");

	const accessControlAllowMethods = res.headers.get("Access-Control-Allow-Methods");
	expect(accessControlAllowMethods?.includes("GET")).toBe(true);
	expect(accessControlAllowMethods?.includes("HEAD")).toBe(true);
	expect(accessControlAllowMethods?.includes("OPTIONS")).toBe(true);
	expect(res.headers.get("Access-Control-Allow-Headers")?.includes("Accept")).toBe(true);
	expect(res.headers.get("X-Clacks-Overhead")).toBeTypeOf("string"); // don't care what we put in here
}

describe("IP Echo", () => {
	let app: Hono<Env>;

	beforeEach(async () => {
		vi.resetModules(); // so we can test mocks on import
		mockServeStatic.mockReturnValue(async c => {
			return await Promise.resolve(c.text("TEST VALUE"));
		});
		app = (await import("./index")).default;
	});

	/**
	 * Calls the app's `request` test handler.
	 */
	async function fetch(
		input: RequestInfo | URL,
		requestInit: RequestInit<CfProperties<unknown>> | undefined = undefined,
		Env: NodeJS.ProcessEnv | null = process.env
	): Promise<Response> {
		return await app.request(input, requestInit, Env ?? undefined);
	}

	const url = new URL("https://localhost/");
	const IP_HEADER_NAME = "CF-Connecting-IP";
	const TEST_IP = "::ffff:127.0.0.1";

	test("exported handler has routes", async () => {
		const { default: app } = await import("./index");
		expect(Array.isArray(app.routes)).toBe(true);
		expect(app.routes.length).toBe(9);
	});

	test("returns 404 for unknown route", async () => {
		const res = await fetch(new URL("lolz", url));
		expect(res.headers.get("Content-Type")).toBe("text/plain;charset=UTF-8");
		expect(res.status).toBe(404);
		expectHeaders(res);
	});

	describe("echo", () => {
		test("responds correctly to CORS preflight", async () => {
			const response = await fetch(url, { method: "OPTIONS" });
			expectHeaders(response);
			expect(response.status).toBe(204);
			expect(response.body).toBeNull();
		});

		// See https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods; note that TRACE is not supported
		const BadMethods = ["POST", "PUT", "DELETE", "PATCH"] as const;
		test.each(BadMethods)("responds 405 to %s requests", async method => {
			const response = await fetch(url, { method });
			expectHeaders(response);
			expect(response.status).toBe(405);
			expect(await response.text()).toBe("Not Allowed\n");
		});

		test("GET responds with the caller's IP address", async () => {
			const response = await fetch(url, { headers: { [IP_HEADER_NAME]: TEST_IP } });
			expectHeaders(response);
			expect(response.headers.get("Content-Type")).toBe("text/plain;charset=UTF-8");
			expect(response.status).toBe(200);
			expect(await response.text()).toBe(TEST_IP.concat("\n"));
		});

		test("HEAD responds with appropriate default headers", async () => {
			const response = await fetch(url, {
				method: "HEAD",
				headers: { [IP_HEADER_NAME]: TEST_IP },
			});
			expectHeaders(response);
			expect(response.headers.get("Content-Type")).toBe("text/plain;charset=UTF-8");
			expect(response.status).toBe(200);
			expect(await response.text()).toBe("");
		});

		test("responds with the caller's IP address in JSON", async () => {
			const response = await fetch(url, {
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
			const response = await fetch(url, {
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
			const response = await fetch(url, {
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
			const response = await fetch(new URL("test", url));
			expect(response.headers.get("Content-Type")).toBe("text/plain;charset=UTF-8");
			expectHeaders(response);
			expect(response.status).toBe(404);
			expect(await response.text()).toBe("Not found\n");
		});

		test("responds with 404 and JSON if the Accept header contains 'application/json'", async () => {
			const response = await fetch(new URL("test", url), {
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
			const response = await fetch(new URL("about", url), { method: "OPTIONS" });
			expectHeaders(response);
			expect(response.status).toBe(204);
			expect(response.body).toBeNull();
		});

		// See https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods; note that TRACE is not supported
		const BadMethods = ["POST", "PUT", "DELETE", "PATCH"] as const;
		test.each(BadMethods)("responds 405 to %s requests", async method => {
			const response = await fetch(new URL("about", url), { method });
			expectHeaders(response);
			expect(response.status).toBe(405);
			expect(await response.text()).toBe("Not Allowed\n");
		});

		test("responds with appropriate metadata", async () => {
			const response = await fetch(new URL("about", url));
			expect(response.headers.get("Content-Type")).toBe("application/json;charset=UTF-8");
			expectHeaders(response);
			expect(response.status).toBe(200);
			expect(await response.json()).toStrictEqual({ repo, title, version });
		});

		test("HEAD responds with appropriate headers", async () => {
			const response = await fetch(new URL("about", url), { method: "HEAD" });
			expect(response.headers.get("Content-Type")).toBe("application/json;charset=UTF-8");
			expectHeaders(response);
			expect(response.status).toBe(200);
			expect(await response.text()).toBe("");
		});
	});

	describe("openapi.yaml", () => {
		test("responds correctly to CORS preflight", async () => {
			const response = await fetch(new URL("openapi.yaml", url), { method: "OPTIONS" });
			expectHeaders(response);
			expect(response.status).toBe(204);
			expect(response.body).toBeNull();
		});

		// See https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods; note that TRACE is not supported
		const BadMethods = ["POST", "PUT", "DELETE", "PATCH"] as const;
		test.each(BadMethods)("responds 405 to %s requests", async method => {
			const response = await fetch(new URL("openapi.yaml", url), { method });
			expectHeaders(response);
			expect(response.status).toBe(405);
			expect(await response.text()).toBe("Not Allowed\n");
		});

		test("responds with our OpenAPI spec", async () => {
			await fetch(new URL("openapi.yaml", url), { method: "HEAD" });
			// expect(response.headers.get("Content-Type")).toBe("application/x-yaml;charset=UTF-8");
			expect(mockServeStatic).toHaveBeenCalledOnce();
			expect(mockServeStatic).toHaveBeenCalledWith({ root: ".", path: "./openapi.yaml" });
		});

		test("responds 404 if serveStatic returns nothing", async () => {
			mockServeStatic.mockImplementationOnce(() => (): Promise<void> => Promise.resolve());
			const response = await fetch(new URL("openapi.yaml", url));
			expect(response.status).toBe(404);
			expect(await response.text()).toBe("Not found\n");
		});

		test("HEAD responds with appropriate headers", async () => {
			const response = await fetch(new URL("openapi.yaml", url), { method: "HEAD" });
			// expect(response.headers.get("Content-Type")).toBe("application/x-yaml;charset=UTF-8");
			// expect(response.headers.get("Content-Type")).toBe("text/plain;charset=UTF-8");
			// expectHeaders(response);
			expect(response.status).toBe(200);
			expect(await response.text()).toBe("");
			expect(mockServeStatic).toHaveBeenCalledOnce();
			expect(mockServeStatic).toHaveBeenCalledWith({ root: ".", path: "./openapi.yaml" });
		});
	});
});
