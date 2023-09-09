import type { Mock as _Mock } from "vitest";

declare global {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	type Mock<F extends (...args: any) => any> = _Mock<Parameters<F>, ReturnType<F>>;
}
