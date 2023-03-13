import { echo } from "./echo";
import { InternalError } from "../errors/InternalError";
import fetchMock from "jest-fetch-mock";
fetchMock.enableMocks(); // Enables use of `Request` and `Response` objects

describe("echo", () => {
	const url = new URL("https://localhost/");
	const IP_HEADER_NAME = "CF-Connecting-IP";
	const TEST_IP = "::ffff:127.0.0.1";

	test("returns the IP address", () => {
		const req = new Request(url, {
			headers: { [IP_HEADER_NAME]: TEST_IP },
		});
		expect(echo(req)).toBe(TEST_IP);
	});

	test("throws if IP is not found", () => {
		const req = new Request(url);
		expect(() => echo(req)).toThrow(InternalError);
	});
});
