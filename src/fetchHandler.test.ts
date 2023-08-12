import "jest-extended";
import type { Context } from "hono";
import type { DataProvider, Env } from "./fetchHandler";
import { handleGet, handlerFor, headHandlerFor } from "./fetchHandler";
import { Hono } from "hono";

function assertHasSecurityHeaders(res: Response): void {
	expect(res).toHaveProperty("headers");

	// ** Security **
	// Cloudflare seems to set Strict-Transport-Security and X-Content-Type-Options automatically
	expect(res.headers.get("Content-Security-Policy")).toBe("default-src 'self'");
	expect(res.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
	expect(res.headers.get("Referrer-Policy")).toBe("no-referrer");
	expect(res.headers.get("Permissions-Policy")).toBe(
		"accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), clipboard-read=(), clipboard-write=(), cross-origin-isolated=(), display-capture=(), document-domain=(), encrypted-media=(), execution-while-not-rendered=(), execution-while-out-of-viewport=(), fullscreen=*, gamepad=(), geolocation=(), gyroscope=(), identity-credentials-get=(), idle-detection=(), interest-cohort=(), keyboard-map=(), local-fonts=(), magnetometer=(), microphone=(), midi=(), navigation-override=(), payment=(), picture-in-picture=*, publickey-credentials-create=(), publickey-credentials-get=(), screen-wake-lock=(), serial=(), speaker-selection=(), storage-access=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=()"
	);

	// ** Miscellaneous **
	expect(res.headers.get("Vary")).toBe("*");
	expect(res.headers.get("Cache-Control")).toBe("no-store");
	expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
	expect(res.headers.get("Access-Control-Allow-Methods")).toInclude("GET");
	expect(res.headers.get("Access-Control-Allow-Headers")).toInclude("Accept");
}

describe("request handler", () => {
	const url = new URL("https://localhost/");
	const next = (): Promise<void> => Promise.resolve(undefined);

	test.each(["test", 42, { a: "b" }])(
		'returns "%s" as JSON if the request\'s `Accept` header requests JSON',
		async value => {
			const getValue = (): typeof value => value;
			const req = new Request(url, { headers: { Accept: "application/json" } });
			const c = { req } as unknown as Context<Env, string>;
			const fetch = handlerFor(getValue);
			const res = await fetch(c, next);

			if (typeof value === "object") {
				/* eslint-disable jest/no-conditional-expect */
				expect(await res.json()).toMatchObject(value);
			} else {
				expect(await res.json()).toBe(value);
				/* eslint-enable jest/no-conditional-expect */
			}
			expect(res.headers.get("Content-Type")).toBe("application/json;charset=UTF-8");
			assertHasSecurityHeaders(res);
			expect(res.status).toBe(200);
		}
	);

	test.each(["test", 42])(
		'returns "%s" as text if the request\'s `Accept` header is missing',
		async value => {
			const getValue = (): typeof value => value;
			const req = new Request(url);
			const c = { req } as unknown as Context<Env, string>;
			const fetch = handlerFor(getValue);
			const res = await fetch(c, next);

			const message = typeof value === "string" ? value : JSON.stringify(value);
			expect(await res.text()).toBe(message.concat("\n"));
			expect(res.headers.get("Content-Type")).toBe("text/plain;charset=UTF-8");
			assertHasSecurityHeaders(res);
			expect(res.status).toBe(200);
		}
	);

	test("returns JSON if the request's `Accept` header is missing but the data is JSON", async () => {
		const value = { a: "b" };
		const getValue = (): typeof value => value;
		const req = new Request(url);
		const c = { req } as unknown as Context<Env, string>;
		const fetch = handlerFor(getValue);
		const res = await fetch(c, next);

		expect(await res.json()).toMatchObject(value);
		expect(res.headers.get("Content-Type")).toBe("application/json;charset=UTF-8");
		assertHasSecurityHeaders(res);
		expect(res.status).toBe(200);
	});

	describe("head", () => {
		test("returns only headers", async () => {
			const value = { a: "b" };
			const getValue = (): typeof value => value;
			const req = new Request(url);
			const c = { req } as unknown as Context<Env, string>;
			const fetch = headHandlerFor(getValue);
			const res = await fetch(c, next);

			expect(await res.text()).toBe("");
			expect(res.headers.get("Content-Type")).toBe("application/json;charset=UTF-8");
			assertHasSecurityHeaders(res);
			expect(res.status).toBe(200);
		});
	});

	describe("GET handler", () => {
		test("sets GET endpoint", async () => {
			const mockApp = new Hono();
			const path = "/foo";
			const result = "bar";
			const provider: DataProvider<typeof path> = () => result;

			expect(handleGet(mockApp, path, provider)).toBe(mockApp);

			const res = await mockApp.request(path);
			expect(res.status).toBe(200);
			expect(await res.text()).toBe(result.concat("\n"));
		});
	});
});
