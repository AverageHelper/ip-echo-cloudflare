import type { Env } from "../fetchHandler";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { handleGet } from "../fetchHandler";
import { echo } from "./echo";
import { Hono } from "hono";

vi.spyOn(console, "error");

describe("echo", () => {
	const url = new URL("https://localhost/");
	const IP_HEADER_NAME = "CF-Connecting-IP";
	const TEST_IP = "::ffff:127.0.0.1";
	const PATH = "/";

	let app: Hono<Env>;

	beforeEach(() => {
		app = new Hono<Env>();
		handleGet(app, PATH, echo);
	});

	test("returns the IP address", async () => {
		const res = await app.request(url, {
			headers: { [IP_HEADER_NAME]: TEST_IP },
		});
		expect(await res.text()).toBe(`${TEST_IP}\n`);
	});

	test("throws if IP is not found", async () => {
		const res = await app.request(url);
		expect(res.status).toBe(500);
		expect(await res.text()).toBe("Internal Server Error");
	});
});
