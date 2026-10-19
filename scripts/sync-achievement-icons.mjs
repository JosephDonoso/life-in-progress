import { mkdir, readFile, writeFile } from "node:fs/promises";

// Vendored assets: the deployed site never needs an external emoji service.
const version = "17.0.3";
const source = `https://raw.githubusercontent.com/jdecked/twemoji/v${version}/`;
const root = new URL("../", import.meta.url);
const directory = new URL("public/images/achievements/", root);
const catalog = JSON.parse(
  await readFile(new URL("catalogo.json", root), "utf8"),
);
const icons = [...new Set(catalog.logros.map((a) => a.icono))].filter(
  (icon) => !/^(?:https?:\/\/|\.?\.?\/|images\/)/.test(icon),
);
const manifest = {};
await mkdir(directory, { recursive: true });
async function download(path) {
  const response = await fetch(source + path);
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.text();
}
let cursor = 0;
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (cursor < icons.length) {
      const icon = icons[cursor++];
      const normalized = icon.includes("\u200d")
        ? icon
        : icon.replaceAll("\ufe0f", "");
      const code = [...normalized]
        .map((c) => c.codePointAt(0).toString(16))
        .join("-");
      const filename = `${code}.svg`;
      const svg = await download(`assets/svg/${filename}`);
      if (!svg.includes("<svg") || /<script\b|<foreignObject\b/i.test(svg)) {
        throw new Error(`Invalid SVG: ${filename}`);
      }
      await writeFile(new URL(filename, directory), svg);
      manifest[icon] = filename;
    }
  }),
);
await writeFile(
  new URL("LICENSE-GRAPHICS.txt", directory),
  await download("LICENSE-GRAPHICS"),
);
await writeFile(
  new URL("ATTRIBUTION.txt", directory),
  `Twemoji graphics v${version}\nCopyright Twitter, Inc. and other contributors.\nSource: https://github.com/jdecked/twemoji/tree/v${version}/assets/svg\nLicense: Creative Commons Attribution 4.0 International (CC BY 4.0).\nhttps://creativecommons.org/licenses/by/4.0/\nGraphics are redistributed unmodified.\n`,
);
await writeFile(
  new URL("src/achievementArtwork.json", root),
  JSON.stringify(
    Object.fromEntries(
      Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)),
    ),
    null,
    2,
  ) + "\n",
);
console.log(
  `${icons.length} local images cover all ${catalog.logros.length} achievements.`,
);
