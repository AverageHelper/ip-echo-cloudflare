import { about } from "./about";
import { repo, version } from "../meta";

describe("about", () => {
	test("responds with appropriate metadata", () => {
		expect(about()).toStrictEqual({ repo, version });
	});
});
