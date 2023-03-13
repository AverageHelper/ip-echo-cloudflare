import { repo, title, version } from "../meta";

/**
 * @returns Some metadata about the project.
 */
export function about(): object {
	return { repo, title, version };
}
