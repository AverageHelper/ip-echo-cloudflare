// Common headers:
export const headers = {
	Vary: "*", // See https://stackoverflow.com/a/54337073 for why "Vary: *" is necessary for Safari
	"Cache-Control": "no-store",
	"X-Clacks-Overhead": "GNU Terry Pratchett",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers": "Accept, Content-Length, Content-Type, Date",
	"Access-Control-Allow-Origin": "*",
} as const;
