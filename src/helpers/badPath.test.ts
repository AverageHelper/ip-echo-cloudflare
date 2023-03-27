import type { Context } from "hono";
import { NotFoundError } from "../errors/NotFoundError";
import { badPath } from "./badPath";
import fetchMock from "jest-fetch-mock";
fetchMock.enableMocks(); // Enables use of `Request` and `Response` objects

describe("badPath", () => {
	const url = new URL("https://localhost/");

	test("throws a NotFoundError", () => {
		const req = new Request(url);
		const c = { req } as unknown as Context;
		expect(() => badPath(c)).toThrow(NotFoundError);
	});
});
