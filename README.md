# IP Echo

A simple no-logs Cloudflare Worker that returns the caller's IP address.

## Usage

A `GET` request to <https://ip.average.name> will return a string containing the caller's IP address.

```sh
$ curl https://ip.average.name
1.2.3.4
```

The API is documented using [OpenAPI](https://petstore.swagger.io/?url=https://raw.githubusercontent.com/AverageHelper/ip-echo-cloudflare/main/openapi.yaml). You can generate a TypeScript client by plugging our spec file into [oazapfts](https://www.npmjs.com/package/oazapfts):

```sh
$ oazapfts https://raw.githubusercontent.com/AverageHelper/ip-echo-cloudflare/main/openapi.yaml ./ip.ts
```

```ts
import { ip } from "./ip";

const result = await ip();

switch (result.status) {
	case 200:
		console.info(result.data); // "1.2.3.4"
		break;

	case 404:
		console.warn("Couldn't get IP address");
		break;

	default:
		console.error("Something went very very wrong!");
}
```
