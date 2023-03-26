import type { Context } from "hono";
import { errorSanity } from "./errorSanity";
import { InternalError } from "../errors/InternalError";
import fetchMock from "jest-fetch-mock";
fetchMock.enableMocks(); // Enables use of `Request` and `Response` objects

describe("sanity test for 500 errors", () => {
	const url = new URL("https://localhost/");

	test("throws InternalError", () => {
		const req = new Request(url);
		const c = { req } as unknown as Context;
		expect(() => errorSanity(c)).toThrow(InternalError);
	});
});
