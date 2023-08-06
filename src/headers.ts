// Common headers:
export const headers = {
	Vary: "*", // See https://stackoverflow.com/a/54337073 for why "Vary: *" is necessary for Safari
	"Cache-Control": "no-store",
	"X-Clacks-Overhead": "GNU Terry Pratchett",
	"Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
	"Access-Control-Allow-Headers": "Accept, Content-Length, Content-Type, Date",
	"Access-Control-Allow-Origin": "*",
	"Content-Security-Policy": "default-src 'self'",
	"X-Frame-Options": "SAMEORIGIN",
	"Referrer-Policy": "no-referrer",
	"Permissions-Policy":
		"accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), clipboard-read=(), clipboard-write=(), cross-origin-isolated=(), display-capture=(), document-domain=(), encrypted-media=(), execution-while-not-rendered=(), execution-while-out-of-viewport=(), fullscreen=*, gamepad=(), geolocation=(), gyroscope=(), identity-credentials-get=(), idle-detection=(), interest-cohort=(), keyboard-map=(), local-fonts=(), magnetometer=(), microphone=(), midi=(), navigation-override=(), payment=(), picture-in-picture=*, publickey-credentials-create=(), publickey-credentials-get=(), screen-wake-lock=(), serial=(), speaker-selection=(), storage-access=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=()",
} as const;
