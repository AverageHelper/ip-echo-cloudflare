import type { Context } from "hono";
import { MethodNotAllowedError } from "../errors/MethodNotAllowedError";
import { badMethod } from "./badMethod";
import fetchMock from "jest-fetch-mock";
fetchMock.enableMocks(); // Enables use of `Request` and `Response` objects

describe("badMethod", () => {
	const url = new URL("https://localhost/");

	test("throws a MethodNotAllowedError", () => {
		const req = new Request(url);
		const c = { req } as unknown as Context;
		expect(() => badMethod(c)).toThrow(MethodNotAllowedError);
	});
});
