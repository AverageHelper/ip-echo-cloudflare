import type { Router } from "../Router";
import { about } from "./about";
import { echo } from "./echo";

export const routes: Router = {
	"/": {
		GET: echo,
	},
	"/about": {
		GET: about,
	},
};
