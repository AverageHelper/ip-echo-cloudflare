import "jest-extended";
import { cors } from "./cors";
import fetchMock from "jest-fetch-mock";
fetchMock.enableMocks(); // Enables use of `Request` and `Response` objects

describe("cors", () => {
	test("returns a Response with appropriate headers", () => {
		const res = cors();

		expect(res.headers.get("Access-Control-Allow-Methods")).toInclude("GET");
		expect(res.headers.get("Access-Control-Allow-Methods")).toInclude("HEAD");
		expect(res.headers.get("Access-Control-Allow-Methods")).toInclude("OPTIONS");

		expect(res.headers.get("Access-Control-Allow-Headers")).toInclude("Accept");
		expect(res.headers.get("Access-Control-Allow-Headers")).toInclude("Content-Type");
		expect(res.headers.get("Access-Control-Allow-Headers")).toInclude("Content-Length");

		expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
	});
});
