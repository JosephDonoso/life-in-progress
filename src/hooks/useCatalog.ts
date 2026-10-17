import { useEffect, useRef, useState } from "react";
import { categories as defaults, demo, achievementRarity } from "../data";
import type { Achievement } from "../data";
import { db } from "../service";
import type { Progress } from "../service";
import { useLanguage } from "../i18n/useLanguage";
import { compareAchievements } from "../sorting";
export function useCatalog(
  progress: Progress,
  retry: number,
  setError: (error: string) => void,
  initialSort = "catalog",
  progressive = false,
) {
  const cache = useRef<{
    version: string;
    page: number;
    items: Achievement[];
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
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

  const filterKey = JSON.stringify([
    query,
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
    let active = true;
    const version = JSON.stringify([filterKey, progress.unlocked, retry]);
    async function load() {
      setLoading(true);
      try {
        if (!db) {
          const filtered = demo.filter(
            (a) =>
              (!query ||
                `${a.name} ${a.description} ${t(a.name)} ${t(a.description)}`
                  .toLowerCase()
                  .includes(query.toLowerCase())) &&
              (!category || a.category === category) &&
              (!rare || achievementRarity(a) === rare) &&
              (status === "all" ||
                (status === "unlocked"
                  ? progress.unlocked.includes(a.id)
                  : !progress.unlocked.includes(a.id))),
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
              db!.rpc("catalog_page", {
                search_text: query,
                category_name: category,
                rarity_name: rare,
                state_filter: status,
                sort_order: sort,
                page_number: pageNumber,
                locale_language: language,
              }),
            ),
          );
          const failed = responses.find((r) => r.error);
          if (failed) throw failed.error;
          const data = responses[0].data;
          const batch: Achievement[] = responses.flatMap((r) => r.data.items);
          const combined = append ? [...cache.current!.items, ...batch] : batch;
          const visible = [...new Map(combined.map((a) => [a.id, a])).values()];
          const [s, c] = await Promise.all([
            db.rpc("global_stats"),
            db.from("categories").select("name").order("name"),
          ]);
          if (s.error || c.error) throw s.error || c.error;
          if (active) {
            cache.current = { version, page, items: visible };
            setItems(visible);
            setCount(data.total);
            setStats(s.data);
            setCategories(c.data.map((x) => x.name));
          }
        }
      } catch {
        if (active)
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
    };
  }, [
    query,
    category,
    rare,
    status,
    sort,
    page,
    progress.unlocked,
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
