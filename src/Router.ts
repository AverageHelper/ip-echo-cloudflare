import { MethodNotAllowedError } from "./errors/MethodNotAllowedError";

// See https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods; note that Cloudflare doesn't support TRACE
export const methods = ["GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"] as const;

export type Method = (typeof methods)[number];

export function assertValidMethod(tbd: string): asserts tbd is Method {
	if (!methods.includes(tbd as Method)) throw new MethodNotAllowedError();
}

export type Router = { [path: string]: Route } & {
	[N in ""]?: never;
};

export type Route = {
	[K in Method]?: Handler;
};

export type Handler = (req: Request) => unknown;
