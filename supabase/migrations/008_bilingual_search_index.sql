-- Match the exact Spanish + English expression used by catalog_page (migration 006).
-- The partial index only includes achievements the public catalog can return.
begin;
create index achievements_search_bilingual on public.achievements using gin (
 (name || ' ' || description || ' ' || coalesce(translations->'en'->>'name','') || ' ' || coalesce(translations->'en'->>'description','')) gin_trgm_ops
) where active;
drop index if exists public.achievements_search;
commit;
