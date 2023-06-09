import { repo, title, version } from "../meta";

/**
 * @returns Some metadata about the project.
 */
export function about(): Record<string, string> {
	return { repo, title, version };
}
