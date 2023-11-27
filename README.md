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

## No logs?

Not actively. Cloudflare lets me start streaming live access logs down on-demand, and these logs tell me the IP address and inferred location of the request, which is far from ideal. You'll just have to trust that I'm not storing that anywhere.

If you're concerned I may be snooping, feel free to run your own instance:

### Prerequisites

This project requires [NodeJS](https://nodejs.org/) (version 18.17 or later) and [NPM](https://npmjs.org/). To make sure you have them available on your machine,
try running the following command:

```sh
$ npm -v && node -v
9.6.7
v18.17.1
```

### Clone the repo

```sh
$ cd path/to/parent
$ git clone https://codeberg.org/AverageHelper/ip-echo-cloudflare.git
$ cd ip-echo-cloudflare
```

### Install dependencies

```sh
$ npm ci
```

### Make sure everything lints and compiles

```sh
$ npm run build
```

### Deploy to your own Cloudflare zone

```sh
$ npm run deploy
```
