import "jest-extended";
import fetchMock from "jest-fetch-mock";
fetchMock.enableMocks(); // Enables use of `Request` and `Response` objects

const mockHandler = jest.fn().mockReturnValue("TEST_PASS");

jest.mock("./routes", () => ({
	routes: {
		"/": {
			GET: mockHandler,
		},
		"/about": {
			GET: mockHandler,
		},
	},
}));

import { fetchHandler } from "./fetchHandler";

function expectCorsHeaders(res: Response): void {
	expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
	expect(res.headers.get("Access-Control-Allow-Methods")).toBe("GET, OPTIONS");
	expect(res.headers.get("Access-Control-Allow-Headers")).toBe(
		"Accept, Content-Length, Content-Type, Date"
	);
}

describe("fetchHandler", () => {
	const url = new URL("https://localhost/");

	test("returns 404 for unknown route", () => {
		const req = new Request(new URL("lolz", url));
		const res = fetchHandler(req);
		expect(res.headers.get("Content-Type")).toBe("text/plain");
		expect(res.status).toBe(404);
		expectCorsHeaders(res);
		expect(mockHandler).not.toHaveBeenCalled();
	});

	// See https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods; note that TRACE is not supported
	const BadMethods = ["HEAD", "POST", "PUT", "DELETE", "PATCH"] as const;
	test.each(BadMethods)("returns 405 for disallowed method '%s'", method => {
		const req = new Request(url, { method });
		const res = fetchHandler(req);
		expect(res.headers.get("Content-Type")).toBe("text/plain");
		expect(res.status).toBe(405);
		expectCorsHeaders(res);
		expect(mockHandler).not.toHaveBeenCalled();
	});

	test("returns 500 and text if handler throws unknown error", async () => {
		mockHandler.mockImplementationOnce(() => {
			throw new Error("This is a test");
		});

		const req = new Request(url);
		const res = fetchHandler(req);
		expect(res.headers.get("Content-Type")).toBe("text/plain");
		expect(res.status).toBe(500);
		expect(await res.text()).toBe("Internal error\n");
		expectCorsHeaders(res);
		expect(mockHandler).toHaveBeenCalledOnceWith(req);
	});

	test("returns 500 and JSON if handler throws unknown error", async () => {
		mockHandler.mockImplementationOnce(() => {
			throw new Error("This is a test");
		});

		const req = new Request(url, { headers: { Accept: "application/json" } });
		const res = fetchHandler(req);
		expect(res.headers.get("Content-Type")).toBe("application/json");
		expect(res.status).toBe(500);
		expect(await res.json()).toStrictEqual({ status: 500, message: "Internal error" });
		expectCorsHeaders(res);
		expect(mockHandler).toHaveBeenCalledOnceWith(req);
	});

	test("returns 204 for CORS preflight", () => {
		const req = new Request(url, { method: "OPTIONS" });
		const res = fetchHandler(req);
		expect(res.headers.get("Content-Type")).toBeNull();
		expect(res.status).toBe(204);
		expectCorsHeaders(res);
		expect(mockHandler).not.toHaveBeenCalled();
	});

	test("returns 200 and plain string", async () => {
		const req = new Request(url);
		const res = fetchHandler(req);
		expect(res.headers.get("Content-Type")).toBe("text/plain");
		expect(res.status).toBe(200);
		expect(await res.text()).toBe("TEST_PASS\n");
		expectCorsHeaders(res);
		expect(mockHandler).toHaveBeenCalledOnceWith(req);
	});

	test("returns 200 and plain number", async () => {
		const value = 42;
		mockHandler.mockReturnValueOnce(value);

		const req = new Request(url);
		const res = fetchHandler(req);
		expect(res.headers.get("Content-Type")).toBe("text/plain");
		expect(res.status).toBe(200);
		expect(await res.text()).toBe(`${value}\n`);
		expectCorsHeaders(res);
		expect(mockHandler).toHaveBeenCalledOnceWith(req);
	});

	test("returns 200 and JSON string", async () => {
		const req = new Request(url, { headers: { Accept: "application/json" } });
		const res = fetchHandler(req);
		expect(res.headers.get("Content-Type")).toBe("application/json");
		expect(res.status).toBe(200);
		expect(await res.json()).toBe("TEST_PASS");
		expectCorsHeaders(res);
		expect(mockHandler).toHaveBeenCalledOnceWith(req);
	});

	test("returns 200 and JSON data if the endpoint always returns an object", async () => {
		const value = { foo: "bar" };
		mockHandler.mockReturnValueOnce(value);

		const req = new Request(url); // would otherwise do 'text/plain'
		const res = fetchHandler(req);
		expect(res.headers.get("Content-Type")).toBe("application/json");
		expect(res.status).toBe(200);
		expect(await res.json()).toStrictEqual(value);
		expectCorsHeaders(res);
		expect(mockHandler).toHaveBeenCalledOnceWith(req);
	});
});
