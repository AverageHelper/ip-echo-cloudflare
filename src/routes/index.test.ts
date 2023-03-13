import { routes } from "./index";

describe("router", () => {
	test("doesn't contain invalid routes", () => {
		expect(Object.keys(routes)).not.toContain("");
	});
});
