import { repo, version } from "../meta";

/**
 * @returns Some metadata about the project.
 */
export function about(): object {
	return { repo, version };
}
