// Rebuild the curated seed when editing the local demonstration catalog.
import { writeFileSync } from "node:fs";
import { categories, demo } from "../src/data.ts";
import { english } from "../src/i18n/english.ts";
const quote = (value) => "'" + value.replaceAll("'", "''") + "'";
const sql =
  `-- Curated catalog only. No fabricated users or unlock statistics.\ninsert into public.categories(name) values\n${categories.map((c) => `(${quote(c)})`).join(",\n")}\non conflict(name) do nothing;\n\n` +
  demo
    .map(
      (a) =>
        `insert into public.achievements(name,description,icon,category_id,translations) select ${quote(a.name)},${quote(a.description)},${quote(a.icon)},id,${quote(JSON.stringify({ en: { name: english[a.name] || a.name, description: english[a.description] || a.description } }))}::jsonb from public.categories where name=${quote(a.category)} on conflict(name) do update set translations=excluded.translations;`,
    )
    .join("\n") +
  "\n";
writeFileSync(new URL("./seed.sql", import.meta.url), sql);
