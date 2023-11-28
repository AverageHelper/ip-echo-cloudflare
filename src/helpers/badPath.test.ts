import type { Env } from "../fetchHandler";
import { describe, expect, test } from "vitest";
import { badPath } from "./badPath";
import { errorHandler } from "../errorHandler";
import { Hono } from "hono";

describe("badPath", () => {
	const url = new URL("https://localhost/foo");

	test("throws a NotFoundError", async () => {
		const app = new Hono<Env>();
		app.get("/", () => expect.unreachable());
		app.notFound(badPath);
		app.onError(errorHandler);
		const res = await app.request(url);
		expect(res.status).toBe(404);
		expect(await res.text()).toBe("Not found\n");
	});
});
