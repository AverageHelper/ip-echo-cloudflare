import { assertValidMethod, methods } from "./Router";
import { MethodNotAllowedError } from "./errors/MethodNotAllowedError";

describe("assertValidMethod", () => {
	test("throws if value is not a valid method", () => {
		expect(() => assertValidMethod("lolz")).toThrow(MethodNotAllowedError);
	});

	test.each(methods)("returns if value is '%s'", method => {
		expect(() => assertValidMethod(method)).not.toThrow();
	});
});
