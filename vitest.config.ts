import { defineConfig } from "vitest/config";

// eslint-disable-next-line import/no-default-export
export default defineConfig({
	test: {
		typecheck: {
			checker: "tsc",
			tsconfig: "./tsconfig.test.json",
		},
		mockReset: true,
		clearMocks: true,
		environment: "miniflare",
		coverage: {
			enabled: true,
			all: true,
			provider: "istanbul",
			reportsDirectory: "coverage",
			include: ["src/**"],
		},
	},
});
