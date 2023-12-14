#!/usr/bin/env tsx

import { parser as changelogParser } from "keep-a-changelog";
import { readFileSync } from "node:fs";

// Parses the changelog for 'version', 'description', 'versionMajor', and 'status' bits, and
// creates a Release on the repo host if the release doesn't already exist.
// This script may be run repeatedly on the same project.

const logger = console;

function quote(str: string | undefined): string | undefined {
	if (str === undefined) return str;
	return `'${str}'`;
}

function requireEnv(key: string): string {
	const result = process.env[key];
	if (!result) throw new TypeError(`Missing env var '${key}'`);
	return result;
}

logger.info("** createRelease.ts **");

// Load env vars
const accessToken = requireEnv("FORGEJO_ACCESS_TOKEN");
const ciRepo = requireEnv("GITHUB_REPOSITORY"); // repository full name (`<owner>/<name>`)
const repoReleases = `https://git.average.name/api/v1/repos/${ciRepo}/releases`;
logger.info(`Releases API: ${repoReleases}`);

// Load the changelog
const changelogPath = new URL("../CHANGELOG.md", import.meta.url).pathname;
logger.info("Loading changelog from", quote(changelogPath), "\n");

const rawChangelog = readFileSync(changelogPath, "utf-8");
const changelog = changelogParser(rawChangelog);

const releases = changelog.releases;

// Get current versioned release
const thisReleaseIdx = releases.findIndex(release => release.date && release.parsedVersion);
const thisRelease = releases[thisReleaseIdx];
if (!thisRelease?.parsedVersion || !thisRelease.version)
	throw new TypeError("No versioned release was found.");

// Handy info
const tag: string = `v${thisRelease.version}`;
logger.info("latest version:", tag);
logger.info("version metadata:", thisRelease);

// See https://git.average.name/api/swagger#/repository/repoCreateRelease
// GET /repos/{owner}/{repo}/releases/tags/{tag}
const remoteReleaseRes = await fetch(`${repoReleases}/tags/${tag}`);
const remoteRelease = await remoteReleaseRes.json();

if (remoteReleaseRes.status !== 404) {
	// Release exists! Stop here.
	logger.info("Release already exists on remote:", remoteRelease);
	process.exit(0);
}

// Release doesn't exist! Create it.
logger.info("Release doesn't yet exist on remote. Creating it...");

const isPrerelease: boolean =
	thisRelease.parsedVersion.prerelease.length > 0 || thisRelease.parsedVersion.major === 0;

function toTitleCase(str: string): string {
	const first = str[0];
	if (!first) return str;

	const rest = str.slice(1);
	return `${first.toUpperCase()}${rest}`;
}

// Because keep-a-changelog's description parser is bugged:
let description: string = "";
for (const [heading, changes] of thisRelease.changes) {
	if (changes.length === 0) continue;

	// Heading ('Added', 'Changed', etc.)
	description += "### ";
	description += toTitleCase(heading);
	description += "\n\n";

	// Contents (usually a list)
	for (const change of changes) {
		description += "- ";

		const lines = change.title.split("\n");
		for (const line of lines) {
			if (line.startsWith("- ")) {
				// Sub-list item
				description += "  ";
			}
			description += line;
			description += "\n";
		}
	}

	description += "\n";
}

const output = `current version: ${tag}
is prerelease: ${isPrerelease ? "true" : "false"}
description: ${description.trim()}
`;
logger.info(output);

// See https://git.average.name/api/swagger#/repository/repoCreateRelease
// POST /repos/{owner}/{repo}/releases
const result = await fetch(repoReleases, {
	method: "POST",
	headers: {
		accept: "application/json",
		Authorization: `token ${accessToken}`,
		"Content-Type": "application/json",
	},
	body: JSON.stringify({
		body: description.trim(),
		draft: false,
		name: tag,
		prerelease: isPrerelease,
		tag_name: tag,
		target_commitish: "main",
	}),
});

if (!result.ok) {
	const resultMessage = await result.text();
	throw new Error(resultMessage);
}

const resultMessage = await result.json();
logger.info("Release created:", resultMessage);
