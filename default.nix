# ====================
# Standard system environment for development.
# ***
# Run `nix-shell` in the project root to get started.
# ====================

let
	nixpkgs = fetchTarball "https://github.com/NixOS/nixpkgs/tarball/nixos-23.11";
	pkgs = import nixpkgs { config = {}; overlays = []; };
in

pkgs.mkShell {
	# Add packages here from https://search.nixos.org/
	packages = with pkgs; [
		curl # expert-mode web browser
		jq # JSON parser
		nodejs_20 # V8-based JS interpreter
	];

	# Keep the host's prompt from .bashrc
	NIX_SHELL_PRESERVE_PROMPT = 1;
}
