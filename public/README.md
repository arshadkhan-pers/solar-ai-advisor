This is Astro's static-asset passthrough directory (files here are copied byte-for-byte into `dist/` on build). It belongs only to the Astro project under `src/`.

It is unrelated to — and does not replace — the root-level `images/`, `data/`, and `components/` directories, which are still used directly by the live, unmigrated root `*.html` pages. Do not copy site pages into this directory.

`js/` here is a **symlink to the root `js/` directory** (`public/js -> ../js`), not a copy — Astro pages need their `<script src="js/...">` tags to actually resolve at build time, and a symlink keeps a single source of truth so editing a root `js/*.js` file is automatically reflected for both the still-live legacy pages and the Astro build, with no risk of the two drifting out of sync. Add similar symlinks here (not copies) if a later migration phase needs `images/`, `data/`, etc. inside the Astro build.
