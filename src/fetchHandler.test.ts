import type { Env } from "./fetchHandler";
import { beforeEach, describe, expect, test } from "vitest";
import { handleGet } from "./fetchHandler";
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
	expect(res.headers.get("Access-Control-Allow-Methods")?.includes("GET")).toBe(true);
	expect(res.headers.get("Access-Control-Allow-Headers")?.includes("Accept")).toBe(true);
}

describe("request handler", () => {
	const url = new URL("https://localhost/");

	let app: Hono<Env>;

	beforeEach(() => {
		app = new Hono<Env>();
	});

	test.each(["test", 42, { a: "b" }])(
		'returns "%s" as JSON if the request\'s `Accept` header requests JSON',
		async value => {
			handleGet(app, "/", () => value);
			const res = await app.request(url, { headers: { Accept: "application/json" } });

			if (typeof value === "object") {
				/* eslint-disable vitest/no-conditional-expect */
				expect(await res.json()).toMatchObject(value);
			} else {
				expect(await res.json()).toBe(value);
				/* eslint-enable vitest/no-conditional-expect */
			}
			expect(res.headers.get("Content-Type")).toBe("application/json;charset=UTF-8");
			assertHasSecurityHeaders(res);
			expect(res.status).toBe(200);
		}
	);

	test.each(["test", 42])(
		'returns "%s" as text if the request\'s `Accept` header is missing',
		async value => {
			handleGet(app, "/", () => value);
			const res = await app.request(url);

			const message = typeof value === "string" ? value : JSON.stringify(value);
			expect(await res.text()).toBe(message.concat("\n"));
			expect(res.headers.get("Content-Type")).toBe("text/plain;charset=UTF-8");
			assertHasSecurityHeaders(res);
			expect(res.status).toBe(200);
		}
	);

	test("returns JSON if the request's `Accept` header is missing but the data is JSON", async () => {
		const value = { a: "b" };
		handleGet(app, "/", () => value);
		const res = await app.request(url);

		expect(await res.json()).toMatchObject(value);
		expect(res.headers.get("Content-Type")).toBe("application/json;charset=UTF-8");
		assertHasSecurityHeaders(res);
		expect(res.status).toBe(200);
	});

	describe("head", () => {
		test("returns only headers", async () => {
			const value = { a: "b" };
			handleGet(app, "/", () => value);
			const res = await app.request(url, { method: "HEAD" });

			expect(await res.text()).toBe("");
			expect(res.headers.get("Content-Type")).toBe("application/json;charset=UTF-8");
			assertHasSecurityHeaders(res);
			expect(res.status).toBe(200);
		});
	});

	describe("GET handler", () => {
		test("sets GET endpoint", async () => {
			const path = "/foo";
			const result = "bar";

			expect(handleGet(app, path, () => result)).toBe(app);

			const res = await app.request(path);
			expect(res.status).toBe(200);
			expect(await res.text()).toBe(result.concat("\n"));
		});
	});
});
