import type { Context } from "hono";
import type { Env } from "../fetchHandler";
import { echo } from "./echo";
import { InternalError } from "../errors/InternalError";

describe("echo", () => {
	const url = new URL("https://localhost/");
	const IP_HEADER_NAME = "CF-Connecting-IP";
	const TEST_IP = "::ffff:127.0.0.1";
	const PATH = "/";

	test("returns the IP address", async () => {
		const req = new Request(url, {
			headers: { [IP_HEADER_NAME]: TEST_IP },
		});
		const c = { req } as unknown as Context<Env, typeof PATH>;
		expect(await echo(c)).toBe(TEST_IP);
	});

	test("throws if IP is not found", async () => {
		const req = new Request(url);
		const c = { req } as unknown as Context<Env, typeof PATH>;
		await expect(() => echo(c)).rejects.toThrow(InternalError);
	});
});
