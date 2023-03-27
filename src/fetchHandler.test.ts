import type { Context } from "hono";
import { handlerFor, headHandlerFor } from "./fetchHandler";
import fetchMock from "jest-fetch-mock";
fetchMock.enableMocks(); // Enables use of `Request` and `Response` objects

describe("request handler", () => {
	const url = new URL("https://localhost/");
	const next = (): Promise<void> => Promise.resolve(undefined);

	test.each(["test", 42, { a: "b" }])(
		'returns "%s" as JSON if the request\'s `Accept` header requests JSON',
		async value => {
			const getValue = (): typeof value => value;
			const req = new Request(url, { headers: { Accept: "application/json" } });
			const c = { req } as unknown as Context;
			const fetch = handlerFor(getValue);
			const res = await fetch(c, next);

			expect(await res.json()).toStrictEqual(value);
			expect(res.headers.get("Content-Type")).toBe("application/json;charset=UTF-8");
			expect(res.status).toBe(200);
		}
	);

	test.each(["test", 42])(
		'returns "%s" as text if the request\'s `Accept` header is missing',
		async value => {
			const getValue = (): typeof value => value;
			const req = new Request(url);
			const c = { req } as unknown as Context;
			const fetch = handlerFor(getValue);
			const res = await fetch(c, next);

			const message = typeof value === "string" ? value : JSON.stringify(value);
			expect(await res.text()).toBe(message.concat("\n"));
			expect(res.headers.get("Content-Type")).toBe("text/plain;charset=UTF-8");
			expect(res.status).toBe(200);
		}
	);

	test("returns JSON if the request's `Accept` header is missing but the data is JSON", async () => {
		const value = { a: "b" };
		const getValue = (): typeof value => value;
		const req = new Request(url);
		const c = { req } as unknown as Context;
		const fetch = handlerFor(getValue);
		const res = await fetch(c, next);

		expect(await res.json()).toStrictEqual(value);
		expect(res.headers.get("Content-Type")).toBe("application/json;charset=UTF-8");
		expect(res.status).toBe(200);
	});

	describe("head", () => {
		test("returns only headers", async () => {
			const value = { a: "b" };
			const getValue = (): typeof value => value;
			const req = new Request(url);
			const c = { req } as unknown as Context;
			const fetch = headHandlerFor(getValue);
			const res = await fetch(c, next);

			expect(await res.text()).toBe("");
			expect(res.headers.get("Content-Type")).toBe("application/json;charset=UTF-8");
			expect(res.status).toBe(200);
		});
	});
});
