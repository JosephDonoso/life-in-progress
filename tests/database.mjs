import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const db = new PGlite();
await db.exec(`create role anon; create role authenticated;
create schema auth;
create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}'::jsonb);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema public,auth to anon,authenticated;
grant execute on function auth.uid() to anon,authenticated;`);
// The embedded test runtime lacks pg_trgm. Test all schema, functions and RLS,
// excluding only the extension and its search index.
const migration = readFileSync(
  new URL("../supabase/migrations/001_initial.sql", import.meta.url),
  "utf8",
)
  .replace("create extension if not exists pg_trgm;", "")
  .replace(/create index achievements_search[^;]+;/, "");
await db.exec(migration);
await db.exec(
  readFileSync(
    new URL(
      "../supabase/migrations/002_community_profiles.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
await db.exec(`create schema storage;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$select string_to_array(name,'/')$$;
grant usage on schema storage to authenticated;grant select,insert,update,delete on storage.objects to authenticated;`);
await db.exec(
  readFileSync(
    new URL("../supabase/migrations/003_avatar_storage.sql", import.meta.url),
    "utf8",
  ),
);
await db.exec(
  readFileSync(
    new URL(
      "../supabase/migrations/004_catalog_languages.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
await db.exec(
  readFileSync(new URL("../supabase/seed.sql", import.meta.url), "utf8"),
);
await db.exec(
  readFileSync(
    new URL(
      "../supabase/migrations/006_catalog_sort_directions.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
await db.exec(
  readFileSync(
    new URL(
      "../supabase/migrations/005_achievement_showcases.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
await db.exec(
  "grant select on all tables in schema public to anon,authenticated; grant insert,update,delete on public.user_achievements to authenticated;",
);
const userA = "00000000-0000-0000-0000-000000000001",
  userB = "00000000-0000-0000-0000-000000000002";
await db.exec(`insert into auth.users(id) values('${userA}'),('${userB}');`);
const [{ id }] = (
  await db.query("select id from public.achievements order by name limit 1")
).rows;
await db.exec(`set role authenticated; set request.jwt.claim.sub='${userA}';`);
await db.query(
  "insert into public.user_achievements(user_id,achievement_id) values($1,$2) on conflict(user_id,achievement_id) do update set user_id=excluded.user_id",
  [userA, id],
);
await db.query(
  "insert into public.user_achievements(user_id,achievement_id) values($1,$2) on conflict(user_id,achievement_id) do update set user_id=excluded.user_id",
  [userA, id],
);
assert.equal(
  (await db.query("select * from public.user_achievements")).rows.length,
  1,
);
await assert.rejects(
  db.query(
    "insert into public.user_achievements(user_id,achievement_id) values($1,$2)",
    [userB, id],
  ),
  /row-level security/,
);
await db.query("select public.update_profile(false,$1::uuid[])", [[id]]);
const state = (await db.query("select public.player_state() state")).rows[0]
  .state;
assert.equal(state.unlocked.length, 1);
assert.equal(state.rarest.percentage, 50);
assert.equal(state.featured.length, 1);
assert.equal(state.featured_details.length, 1);
assert.equal(state.featured_details[0].id, id);
assert.equal(state.featured_details[0].percentage, 50);
assert.equal(state.featured_details[0].rarity, "Común");
assert.ok(state.featured_details[0].description);
const ownShowcase = (
  await db.query("select public.public_profile($1) data", [userA])
).rows[0].data;
assert.deepEqual(ownShowcase.featured, state.featured_details);
const catalog = (await db.query("select public.catalog_page() data")).rows[0]
  .data;
assert.equal(catalog.total, 24);
assert.equal(catalog.items.length, 12);
assert.equal(catalog.items[0].percentage, 50);
const englishCatalog = (
  await db.query(
    "select public.catalog_page('meteor','','','all','popular',0,'en') data",
  )
).rows[0].data;
assert.equal(englishCatalog.total, 1);
assert.equal(englishCatalog.items[0].name, "Under the stars");
for (const sort of ["rare", "percentage_asc"]) {
  const data = (
    await db.query("select public.catalog_page('','','','all',$1) data", [sort])
  ).rows[0].data;
  assert.equal(data.items[0].percentage, 0);
}
for (const sort of ["popular", "rarity_asc"]) {
  const data = (
    await db.query("select public.catalog_page('','','','all',$1) data", [sort])
  ).rows[0].data;
  assert.equal(data.items[0].percentage, 50);
}
const firstName = (
  await db.query("select public.catalog_page('','','','all','name') data")
).rows[0].data.items[0].name;
const lastName = (
  await db.query("select public.catalog_page('','','','all','name_desc') data")
).rows[0].data.items[0].name;
assert.notEqual(firstName, lastName);
await db.exec(`set request.jwt.claim.sub='${userB}';`);
assert.equal(
  (await db.query("select public.public_profile($1) data", [userA])).rows[0]
    .data,
  null,
);
await assert.rejects(
  db.query("select public.showcase_details($1)", [userA]),
  /permission denied/,
);
assert.equal(
  (await db.query("select * from public.user_achievements")).rows.length,
  0,
);
assert.equal(
  (await db.query("select public.player_state() state")).rows[0].state.unlocked
    .length,
  0,
);
await db.query("delete from public.user_achievements where user_id=$1", [
  userA,
]);
await db.exec(`set request.jwt.claim.sub='${userA}';`);
assert.equal(
  (await db.query("select * from public.user_achievements")).rows.length,
  1,
);
await db.query("delete from public.user_achievements where user_id=$1", [
  userA,
]);
assert.equal(
  (await db.query("select * from public.featured_achievements")).rows.length,
  0,
);
await db.query("select public.edit_profile($1,$2)", [
  "Nuevo nombre",
  "https://example.com/avatar.webp",
]);
assert.equal(
  (await db.query("select display_name from public.profiles")).rows[0]
    .display_name,
  "Nuevo nombre",
);
await assert.rejects(
  db.query("select public.edit_profile($1,$2)", ["OK", "javascript:alert(1)"]),
  /Invalid avatar URL/,
);
assert.equal(
  (await db.query("select public.public_profile($1) data", [userB])).rows[0]
    .data,
  null,
);
assert.equal(
  (await db.query("select public.community_profiles() data")).rows[0].data
    .total,
  0,
);
await db.exec(`set request.jwt.claim.sub='${userB}';`);
await db.query("select public.update_profile(true,$1::uuid[])", [[]]);
await db.exec(`set request.jwt.claim.sub='${userA}';`);
assert.equal(
  (await db.query("select public.community_profiles() data")).rows[0].data
    .total,
  1,
);
await db.query("select public.friendship_action($1,$2)", [userB, "request"]);
await db.query("select public.friendship_action($1,$2)", [userB, "request"]);
assert.equal(
  (await db.query("select public.community_profiles('','requests') data"))
    .rows[0].data.items[0].relationship,
  "outgoing",
);
await assert.rejects(
  db.query("select public.friendship_action($1,$2)", [userB, "accept"]),
  /Invalid request/,
);
await db.exec(`set request.jwt.claim.sub='${userB}';`);
await db.query("select public.friendship_action($1,$2)", [userA, "accept"]);
await db.query("select public.update_profile(false,$1::uuid[])", [[]]);
await db.exec(`set request.jwt.claim.sub='${userA}';`);
const friend = (
  await db.query("select public.community_profiles('','friends') data")
).rows[0].data.items[0];
assert.equal(friend.relationship, "friends");
assert.equal(friend.display_name, "Perfil privado");
assert.equal(friend.unlocked, null);
await db.query("select public.friendship_action($1,$2)", [userB, "remove"]);
assert.equal(
  (await db.query("select public.community_profiles('','friends') data"))
    .rows[0].data.total,
  0,
);
await db.query("insert into storage.objects(bucket_id,name) values($1,$2)", [
  "avatars",
  userA + "/avatar.webp",
]);
await assert.rejects(
  db.query("insert into storage.objects(bucket_id,name) values($1,$2)", [
    "avatars",
    userB + "/avatar.webp",
  ]),
  /row-level security/,
);
assert.equal(
  (await db.query("select count(*) n from public.rarity_thresholds")).rows[0].n,
  4,
);
await db.exec("set role anon;");
assert.equal(
  (await db.query("select * from public.user_achievements")).rows.length,
  0,
);
await assert.rejects(
  db.query("select public.player_state()"),
  /permission denied/,
);
const stats = (await db.query("select public.global_stats() data")).rows[0]
  .data;
assert.deepEqual(stats, { achievements: 24, players: 2, unlocks: 0 });
await db.close();
console.log(
  "Database checks passed: migration, seed, pagination, idempotency, real percentages, private profiles, RLS isolation, favorite cascade.",
);
