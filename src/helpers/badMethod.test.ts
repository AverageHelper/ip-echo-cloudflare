import type { Env } from "../fetchHandler";
import { badMethod } from "./badMethod";
import { describe, expect, test } from "vitest";
import { errorHandler } from "../errorHandler";
import { Hono } from "hono";

describe("badMethod", () => {
	const url = new URL("https://localhost/");

	test("throws a MethodNotAllowedError", async () => {
		const app = new Hono<Env>();
		app.get("/", badMethod);
		app.onError(errorHandler);
		const res = await app.request(url);
		expect(res.status).toBe(405);
		expect(await res.text()).toBe("Not Allowed\n");
	});
});
