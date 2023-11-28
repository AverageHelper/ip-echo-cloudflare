import type { Env } from "./fetchHandler";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { errorHandler } from "./errorHandler";
import { Hono } from "hono";
import { InternalError } from "./errors/InternalError";
import { MethodNotAllowedError } from "./errors/MethodNotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";

vi.spyOn(console, "error");

describe("error handler", () => {
	const url = new URL("https://localhost/");

	const tests = [
		["InternalError", InternalError],
		["MethodNotAllowedError", MethodNotAllowedError],
		["NotFoundError", NotFoundError],
	] as const;

	let app: Hono<Env>;

	beforeEach(() => {
		app = new Hono<Env>();
		app.onError(errorHandler);
	});

	test.each(tests)(
		"responds with %s message if the 'Accept' header is missing",
		async (_, ErrorType) => {
			const error = new ErrorType();
			app.get("/", () => {
				throw error;
			});
			const res = await app.request(url);

			expect(await res.text()).toBe(error.message.concat("\n"));
			expect(res.headers.get("Content-Type")).toBe("text/plain;charset=UTF-8");
			expect(res.status).toBe(error.status);
		}
	);

	test.each(tests)(
		"responds with %s message if the 'Accept' header is 'text/plain'",
		async (_, ErrorType) => {
			const error = new ErrorType();
			app.get("/", () => {
				throw error;
			});
			const res = await app.request(url, { headers: { Accept: "text/plain" } });

			expect(await res.text()).toBe(error.message.concat("\n"));
			expect(res.headers.get("Content-Type")).toBe("text/plain;charset=UTF-8");
			expect(res.status).toBe(error.status);
		}
	);

	test("responds with an empty string if the 'Accept' header is 'text/plain' and the error has no message", async () => {
		const error = new InternalError(500, "");
		app.get("/", () => {
			throw error;
		});
		const res = await app.request(url, { headers: { Accept: "text/plain" } });

		expect(await res.text()).toBe("");
		expect(res.headers.get("Content-Type")).toBe("text/plain;charset=UTF-8");
		expect(res.status).toBe(500);
	});

	test.each(tests)(
		"responds with %s message and status if the 'Accept' header is 'application/json'",
		async (_, ErrorType) => {
			const error = new ErrorType();
			app.get("/", () => {
				throw error;
			});
			const res = await app.request(url, { headers: { Accept: "application/json" } });

			expect(await res.json()).toMatchObject({ status: error.status, message: error.message });
			expect(res.headers.get("Content-Type")).toBe("application/json;charset=UTF-8");
			expect(res.status).toBe(error.status);
		}
	);

	test("responds with generic internal error if the error is not an instance of HTTPException", async () => {
		const error = new Error("This won't ever be seen");
		app.get("/", () => {
			throw error;
		});
		const res = await app.request(url, { headers: { Accept: "application/json" } });

		expect(await res.json()).toMatchObject({ status: 500, message: "Internal error" });
		expect(res.headers.get("Content-Type")).toBe("application/json;charset=UTF-8");
		expect(res.status).toBe(500);
	});
});
