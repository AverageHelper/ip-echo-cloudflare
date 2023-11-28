import type { Env } from "../fetchHandler";
import { cors } from "./cors";
import { describe, expect, test } from "vitest";
import { Hono } from "hono";

describe("cors", () => {
	test("returns a Response with appropriate headers", async () => {
		const app = new Hono<Env>();
		app.get("/", cors);
		const res = await app.request("/");

		const accessControlAllowMethods = res.headers.get("Access-Control-Allow-Methods");
		expect(accessControlAllowMethods?.includes("GET")).toBe(true);
		expect(accessControlAllowMethods?.includes("HEAD")).toBe(true);
		expect(accessControlAllowMethods?.includes("OPTIONS")).toBe(true);

		const accessControlAllowHeaders = res.headers.get("Access-Control-Allow-Headers");
		expect(accessControlAllowHeaders?.includes("Accept")).toBe(true);
		expect(accessControlAllowHeaders?.includes("Content-Type")).toBe(true);
		expect(accessControlAllowHeaders?.includes("Content-Length")).toBe(true);

		expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
	});
});
