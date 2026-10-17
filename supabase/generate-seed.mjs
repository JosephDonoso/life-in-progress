import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const catalogPath = new URL("../catalogo.json", import.meta.url);
const quote = (value) => "'" + value.replaceAll("'", "''") + "'";
const fail = (message) => {
  throw new Error(`catalogo.json: ${message}`);
};
function text(value, where) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value !== value.trim() ||
    value.includes("\0")
  )
    fail(
      `${where} debe ser un texto no vacío, sin espacios al inicio o al final.`,
    );
}
function list(items, where) {
  if (!Array.isArray(items) || !items.length)
    fail(`${where} debe contener al menos un elemento.`);
  const keys = new Set(),
    names = new Set();
  for (const item of items) {
    if (!item || typeof item !== "object")
      fail(`${where} contiene un elemento inválido.`);
    text(item.clave, `${where}.clave`);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(item.clave))
      fail(
        `la clave ${item.clave} solo permite minúsculas, números y guiones.`,
      );
    text(item.nombre, `${where}.${item.clave}.nombre`);
    if (keys.has(item.clave) || names.has(item.nombre))
      fail(`${where} contiene una clave o nombre duplicado: ${item.clave}.`);
    keys.add(item.clave);
    names.add(item.nombre);
  }
  return keys;
}
export function validateCatalog(catalog) {
  if (!catalog || catalog.version !== 1) fail("version debe ser 1.");
  const categories = list(catalog.categorias, "categorias");
  list(catalog.logros, "logros");
  for (const a of catalog.logros) {
    text(a.descripcion, `${a.clave}.descripcion`);
    text(a.icono, `${a.clave}.icono`);
    if (!categories.has(a.categoria))
      fail(`${a.clave} usa una categoría que no existe: ${a.categoria}.`);
    if (typeof a.activo !== "boolean")
      fail(`${a.clave}.activo debe ser true o false.`);
    if (
      typeof a.fecha !== "string" ||
      !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(a.fecha) ||
      !Number.isFinite(Date.parse(a.fecha)) ||
      new Date(a.fecha).toISOString() !== a.fecha
    )
      fail(`${a.clave}.fecha debe tener formato 2026-01-01T00:00:00.000Z.`);
    if (
      typeof a.porcentaje_demostracion !== "number" ||
      !Number.isFinite(a.porcentaje_demostracion) ||
      a.porcentaje_demostracion < 0 ||
      a.porcentaje_demostracion > 100
    )
      fail(`${a.clave}.porcentaje_demostracion debe estar entre 0 y 100.`);
    if (a.ingles) {
      text(a.ingles.nombre, `${a.clave}.ingles.nombre`);
      text(a.ingles.descripcion, `${a.clave}.ingles.descripcion`);
    }
  }
  for (const c of catalog.categorias)
    if (c.ingles !== undefined) text(c.ingles, `${c.clave}.ingles`);
  const names = ["Común", "Raro", "Épico", "Legendario"];
  if (
    !Array.isArray(catalog.rarezas) ||
    catalog.rarezas.length !== names.length
  )
    fail(
      "rarezas debe contener Común, Raro, Épico y Legendario, en ese orden.",
    );
  let previous = 101;
  for (const [i, r] of catalog.rarezas.entries()) {
    if (
      !r ||
      r.nombre !== names[i] ||
      typeof r.porcentaje_minimo !== "number" ||
      !Number.isFinite(r.porcentaje_minimo) ||
      r.porcentaje_minimo < 0 ||
      r.porcentaje_minimo > 100 ||
      r.porcentaje_minimo >= previous
    )
      fail(
        "los umbrales de rareza deben ir de mayor a menor, entre 0 y 100, conservando los cuatro nombres.",
      );
    previous = r.porcentaje_minimo;
  }
  if (previous !== 0)
    fail("Legendario debe comenzar en 0 para cubrir todos los porcentajes.");
  return catalog;
}
export function catalogSql(input) {
  const catalog = validateCatalog(input);
  const lines = [
    "-- Generated from catalogo.json by npm run catalog:generate.",
    "-- Apply migrations through 007 first. No users or unlocks are created or deleted.",
    "begin;",
  ];
  // Replacing thresholds prevents unique-minimum conflicts when changing bands.
  lines.push("delete from public.rarity_thresholds;");
  lines.push(
    `insert into public.rarity_thresholds(name,minimum) values ${catalog.rarezas.map((r) => `(${quote(r.nombre)},${r.porcentaje_minimo})`).join(",")};`,
  );
  for (const c of catalog.categorias) {
    lines.push(
      `update public.categories set catalog_key=${quote(c.clave)} where catalog_key is null and name=${quote(c.nombre)};`,
    );
    lines.push(
      `insert into public.categories(catalog_key,name) values(${quote(c.clave)},${quote(c.nombre)}) on conflict(catalog_key) do update set name=excluded.name;`,
    );
  }
  for (const a of catalog.logros) {
    lines.push(
      `update public.achievements set catalog_key=${quote(a.clave)} where catalog_key is null and name=${quote(a.nombre)};`,
    );
    const translations = a.ingles
      ? { en: { name: a.ingles.nombre, description: a.ingles.descripcion } }
      : {};
    lines.push(
      `insert into public.achievements(catalog_key,name,description,icon,category_id,active,created_at,translations) select ${quote(a.clave)},${quote(a.nombre)},${quote(a.descripcion)},${quote(a.icono)},id,${a.activo},${quote(a.fecha)}::timestamptz,${quote(JSON.stringify(translations))}::jsonb from public.categories where catalog_key=${quote(a.categoria)} on conflict(catalog_key) do update set name=excluded.name,description=excluded.description,icon=excluded.icon,category_id=excluded.category_id,active=excluded.active,created_at=excluded.created_at,translations=excluded.translations;`,
    );
  }
  lines.push(
    `update public.achievements set active=false where catalog_key is not null and catalog_key not in (${catalog.logros.map((a) => quote(a.clave)).join(",")});`,
  );
  lines.push("commit;", "");
  return lines.join("\n");
}
if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  try {
    const catalog = validateCatalog(
      JSON.parse(readFileSync(catalogPath, "utf8")),
    );
    if (process.argv.includes("--check"))
      console.log(
        `Catálogo válido: ${catalog.logros.filter((a) => a.activo).length} logros activos, ${catalog.categorias.length} categorías.`,
      );
    else {
      writeFileSync(
        new URL("./seed.sql", import.meta.url),
        catalogSql(catalog),
      );
      console.log(
        "Generado supabase/seed.sql desde catalogo.json. Aplícalo en Supabase para actualizar el catálogo conectado.",
      );
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
