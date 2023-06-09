import type { Context } from "hono";
import { errorHandler } from "./errorHandler";
import { InternalError } from "./errors/InternalError";
import { MethodNotAllowedError } from "./errors/MethodNotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";
import fetchMock from "jest-fetch-mock";
fetchMock.enableMocks(); // Enables use of `Request` and `Response` objects

describe("error handler", () => {
	const url = new URL("https://localhost/");

	const tests = [
		["InternalError", InternalError],
		["MethodNotAllowedError", MethodNotAllowedError],
		["NotFoundError", NotFoundError],
	] as const;

	test.each(tests)(
		"responds with %s message if the 'Accept' header is missing",
		async (_, ErrorType) => {
			const req = new Request(url);
			const c = { req } as unknown as Context;
			const error = new ErrorType(c.res);
			const res = errorHandler(error, c);

			expect(await res.text()).toBe(error.message.concat("\n"));
			expect(res.headers.get("Content-Type")).toBe("text/plain;charset=UTF-8");
			expect(res.status).toBe(error.status);
		}
	);

	test.each(tests)(
		"responds with %s message if the 'Accept' header is 'text/plain'",
		async (_, ErrorType) => {
			const req = new Request(url, { headers: { Accept: "text/plain" } });
			const c = { req } as unknown as Context;
			const error = new ErrorType(c.res);
			const res = errorHandler(error, c);

			expect(await res.text()).toBe(error.message.concat("\n"));
			expect(res.headers.get("Content-Type")).toBe("text/plain;charset=UTF-8");
			expect(res.status).toBe(error.status);
		}
	);

	test.each(tests)(
		"responds with %s message and status if the 'Accept' header is 'application/json'",
		async (_, ErrorType) => {
			const req = new Request(url, { headers: { Accept: "application/json" } });
			const c = { req } as unknown as Context;
			const error = new ErrorType(c.res);
			const res = errorHandler(error, c);

			expect(await res.json()).toStrictEqual({ status: error.status, message: error.message });
			expect(res.headers.get("Content-Type")).toBe("application/json;charset=UTF-8");
			expect(res.status).toBe(error.status);
		}
	);

	test("responds with generic internal error if the error is not an instance of HTTPException", async () => {
		const req = new Request(url, { headers: { Accept: "application/json" } });
		const c = { req } as unknown as Context;
		const error = new Error("This won't ever be seen");
		const res = errorHandler(error, c);

		expect(await res.json()).toStrictEqual({ status: 500, message: "Internal error" });
		expect(res.headers.get("Content-Type")).toBe("application/json;charset=UTF-8");
		expect(res.status).toBe(500);
	});
});
