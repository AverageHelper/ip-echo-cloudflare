import type { Context } from "hono";
import type { Env } from "../fetchHandler";
import { NotFoundError } from "../errors/NotFoundError";
import { badPath } from "./badPath";

describe("badPath", () => {
	const url = new URL("https://localhost/");

	test("throws a NotFoundError", () => {
		const req = new Request(url);
		const c = { req } as unknown as Context<Env>;
		expect(() => badPath(c)).toThrow(NotFoundError);
	});
});
