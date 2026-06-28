This is Astro's static-asset passthrough directory (files here are copied byte-for-byte into `dist/` on build). It belongs only to the Astro project under `src/`.

It is unrelated to — and does not replace — the root-level `images/`, `js/`, `data/`, and `components/` directories, which are still used directly by the live, unmigrated root `*.html` pages. Do not copy site pages into this directory.
