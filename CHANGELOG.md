# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.3] - 2023-12-16
### Added
- `default.nix` file for nix-shell users to get the right development dependencies. This is my first foray into managing global dev dependencies using Nix, so feedback is appreciated!

### Changed
- Use Node 20 in dev environment.

### Security
- Updated vulnerable dependencies.

## [1.2.2] - 2023-12-14
### Changed
- Moved to my own Forgejo instance.

## [1.2.1] - 2023-11-27
### Fixed
- Send CORS and other appropriate headers with our API spec file.

## [1.2.0] - 2023-11-27
### Added
- New endpoint `/openapi.yaml` answers `GET` requests with our API spec file.

## [1.1.5] - 2023-11-27
### Changed
- Updated Hono, and simplified some internals.

### Fixed
- Unit tests collect coverage reports now.

## [1.1.4] - 2023-09-08
### Changed
- Use Vitest instead of Jest as our internal test harness.

## [1.1.3] - 2023-08-12
### Changed
- Updated engine to Node 18.

## [1.1.2] - 2023-08-06
### Security
- Send `Content-Security-Policy`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` headers.

## [1.1.1] - 2023-03-27
### Changed
- Use "real" routing software so there's less for us to maintain. This way we can better apply what we learn in this package to bigger projects.
- `Content-Type` response headers now include a `charset` declaration.

### Fixed
- `HEAD` requests now [correctly](https://developer.mozilla.org/en-US/docs/web/http/methods/head) respond with the headers that a `GET` request might have sent.

## [1.1.0] - 2023-03-12
### Added
- A new endpoint, `/about`, returns some metadata about the project.

## [1.0.3] - 2023-03-12
### Fixed
- We now respond only to requests at the root.

## [1.0.2] - 2023-03-11
### Changed
- `Content-Type` is now `text/plain` by default.

## [1.0.1] - 2023-03-11
### Fixed
- Use a valid `compatibility_date` in the Wrangler config.

## [1.0.0] - 2023-03-11
### Added
- Cloudflare Worker to echo the caller's IP address.

[1.2.3]: https://git.average.name/AverageHelper/ip-echo-cloudflare/compare/v1.2.2...v1.2.3
[1.2.2]: https://git.average.name/AverageHelper/ip-echo-cloudflare/compare/v1.2.1...v1.2.2
[1.2.1]: https://git.average.name/AverageHelper/ip-echo-cloudflare/compare/v1.2.0...v1.2.1
[1.2.0]: https://git.average.name/AverageHelper/ip-echo-cloudflare/compare/v1.1.5...v1.2.0
[1.1.5]: https://git.average.name/AverageHelper/ip-echo-cloudflare/compare/v1.1.4...v1.1.5
[1.1.4]: https://git.average.name/AverageHelper/ip-echo-cloudflare/compare/v1.1.3...v1.1.4
[1.1.3]: https://git.average.name/AverageHelper/ip-echo-cloudflare/compare/v1.1.2...v1.1.3
[1.1.2]: https://git.average.name/AverageHelper/ip-echo-cloudflare/compare/v1.1.1...v1.1.2
[1.1.1]: https://git.average.name/AverageHelper/ip-echo-cloudflare/compare/v1.1.0...v1.1.1
[1.1.0]: https://git.average.name/AverageHelper/ip-echo-cloudflare/compare/v1.0.3...v1.1.0
[1.0.3]: https://git.average.name/AverageHelper/ip-echo-cloudflare/compare/v1.0.2...v1.0.3
[1.0.2]: https://git.average.name/AverageHelper/ip-echo-cloudflare/compare/v1.0.1...v1.0.2
[1.0.1]: https://git.average.name/AverageHelper/ip-echo-cloudflare/compare/v1.0.0...v1.0.1
[1.0.0]: https://git.average.name/AverageHelper/ip-echo-cloudflare/releases/tag/v1.0.0
