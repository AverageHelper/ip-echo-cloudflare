/* eslint-disable unicorn/filename-case, spaced-comment, @typescript-eslint/no-explicit-any */

// See https://jest-extended.jestcommunity.dev/docs/getting-started/setup

import type * as CustomMatchers from "jest-extended";
import type { MockInstance } from "vitest";

declare module "vitest" {
	interface Assertion<T = any> extends CustomMatchers<T> {
		toHaveBeenCalledAfter(
			mock: MockInstance<any, Array<any>>,
			failIfNoFirstInvocation?: boolean
		): void;

		toHaveBeenCalledBefore(
			mock: MockInstance<any, Array<any>>,
			failIfNoSecondInvocation?: boolean
		): void;
	}
	interface AsymmetricMatchersContaining extends Assertion {}
}
