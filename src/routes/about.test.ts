import { describe, expect, test } from "vitest";
import { about } from "./about";
import { repo, title, version } from "../meta";

describe("about", () => {
	test("responds with appropriate metadata", () => {
		expect(about()).toStrictEqual({ repo, title, version });
	});
});
