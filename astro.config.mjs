import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// build.format: "file" keeps output URLs flat (dist/privacy-policy.html)
// instead of Astro's default dist/privacy-policy/index.html, matching the
// canonical URLs already in data/seo-metadata.json and sitemap.xml.
export default defineConfig({
  trailingSlash: "never",
  build: {
    format: "file",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
