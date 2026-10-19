import { useEffect, useRef, useState } from "react";
import { categories as defaults, demo, achievementRarity } from "../data";
import type { Achievement } from "../data";
import { db } from "../service";
import type { Progress } from "../service";
import { useLanguage } from "../i18n/useLanguage";
import { compareAchievements } from "../sorting";
import { useDebouncedValue } from "./useDebouncedValue";
import { getCatalogMetadata } from "../catalogMetadata";
export function useCatalog(
  progress: Progress,
  retry: number,
  setError: (error: string) => void,
  initialSort = "catalog",
  progressive = false,
  userId?: string,
) {
  const cache = useRef<{
    version: string;
    page: number;
    items: Achievement[];
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(!!db);
  const [items, setItems] = useState<Achievement[]>([]),
    [categories, setCategories] = useState(defaults),
    [stats, setStats] = useState({
      achievements: db ? 0 : demo.length,
      players: db ? 0 : 1248,
      unlocks: db ? 0 : 8736,
    });
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [rare, setRare] = useState(""),
    [status, setStatus] = useState("all"),
    [sort, setSort] = useState(initialSort),
    [page, setPage] = useState(0),
    [count, setCount] = useState(0);
  const searchText = query.trim();
  const settledSearch = useDebouncedValue(searchText);
  // Supabase is refreshed after a successful write; optimistic UI updates do not
  // issue reads against the old database state while that write is still pending.
  const unlockedKey = db ? "" : JSON.stringify(progress.unlocked);

  const filterKey = JSON.stringify([
    settledSearch,
    category,
    rare,
    status,
    sort,
    language,
  ]);
  const [lastFilter, setLastFilter] = useState(filterKey);
  if (lastFilter !== filterKey) {
    setLastFilter(filterKey);
    setPage(0);
    if (progressive) {
      setItems([]);
      setCount(0);
    }
  }
  useEffect(() => {
    if (!db) return;
    let active = true;
    async function refresh() {
      try {
        const data = await getCatalogMetadata();
        if (active) {
          setCategories(data.categories);
          setStats(data.stats);
        }
      } catch {
        if (active)
          setError(
            "No pudimos cargar el catálogo. Revisa la conexión y las migraciones de Supabase.",
          );
      }
    }
    void refresh();
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
    };
  }, [retry, userId, setError]);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    // Immediately cancel obsolete searches, then wait for the input to settle.
    if (searchText !== settledSearch) return;
    const version = JSON.stringify([filterKey, unlockedKey, retry, userId]);
    const unlocked = new Set<string>(JSON.parse(unlockedKey || "[]"));
    async function load() {
      setLoading(true);
      try {
        if (!db) {
          const filtered = demo.filter(
            (a) =>
              (!settledSearch ||
                `${a.name} ${a.description} ${t(a.name)} ${t(a.description)}`
                  .toLowerCase()
                  .includes(settledSearch.toLowerCase())) &&
              (!category || a.category === category) &&
              (!rare || achievementRarity(a) === rare) &&
              (status === "all" ||
                (status === "unlocked"
                  ? unlocked.has(a.id)
                  : !unlocked.has(a.id))),
          );
          filtered.sort((a, b) => compareAchievements(a, b, sort, language, t));
          if (active) {
            const visible = filtered.slice(
              progressive ? 0 : page * 12,
              page * 12 + 12,
            );
            cache.current = { version, page, items: visible };
            setItems(visible);
            setCount(filtered.length);
          }
        } else {
          const append =
            progressive &&
            cache.current?.version === version &&
            cache.current.page === page - 1;
          const pages =
            progressive && !append
              ? Array.from({ length: page + 1 }, (_, i) => i)
              : [page];
          const responses = await Promise.all(
            pages.map((pageNumber) =>
              db!
                .rpc("catalog_page", {
                  search_text: settledSearch,
                  category_name: category,
                  rarity_name: rare,
                  state_filter: status,
                  sort_order: sort,
                  page_number: pageNumber,
                  locale_language: language,
                })
                .abortSignal(controller.signal),
            ),
          );
          const failed = responses.find((r) => r.error);
          if (failed) throw failed.error;
          const data = responses[0].data;
          const batch: Achievement[] = responses.flatMap((r) => r.data.items);
          const combined = append ? [...cache.current!.items, ...batch] : batch;
          const visible = [...new Map(combined.map((a) => [a.id, a])).values()];
          if (active) {
            cache.current = { version, page, items: visible };
            setItems(visible);
            setCount(data.total);
          }
        }
      } catch {
        if (active && !controller.signal.aborted)
          setError(
            "No pudimos cargar el catálogo. Revisa la conexión y las migraciones de Supabase.",
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [
    searchText,
    settledSearch,
    category,
    rare,
    status,
    sort,
    page,
    unlockedKey,
    userId,
    retry,
    setError,
    t,
    language,
    filterKey,
    progressive,
    attempt,
  ]);

  return {
    loadMore: () => {
      if (loading) return;
      const next = (cache.current?.page ?? -1) + 1;
      if (next === page) setAttempt((n) => n + 1);
      else setPage(next);
    },
    items,
    categories,
    stats,
    query,
    setQuery,
    category,
    setCategory,
    rare,
    setRare,
    status,
    setStatus,
    sort,
    setSort,
    page,
    setPage,
    count,
    loading,
  };
}
