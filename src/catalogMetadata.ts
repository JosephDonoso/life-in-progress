import { db } from "./service";

// Shared public data only. Account-specific progress is never cached here.
function resource<T>(ttl: number, load: () => Promise<T>) {
  let value: T | undefined;
  let expires = 0;
  let revision = 0;
  let pending: Promise<T> | undefined;
  return {
    get(): Promise<T> {
      if (value !== undefined && Date.now() < expires)
        return Promise.resolve(value);
      if (pending) return pending;
      const version = revision;
      const request = load()
        .then((result) => {
          if (version === revision) {
            value = result;
            expires = Date.now() + ttl;
          }
          return result;
        })
        .finally(() => {
          if (pending === request) pending = undefined;
        });
      pending = request;
      return request;
    },
    invalidate() {
      revision++;
      value = undefined;
      pending = undefined;
    },
  };
}

const categories = resource(5 * 60_000, async () => {
  const { data, error } = await db!
    .from("categories")
    .select("name,achievements!inner(id)")
    .eq("achievements.active", true)
    .order("name");
  if (error) throw error;
  return data.map((c: { name: string }) => c.name);
});
const stats = resource(30_000, async () => {
  const { data, error } = await db!.rpc("global_stats");
  if (error) throw error;
  return data as { achievements: number; players: number; unlocks: number };
});

export async function getCatalogMetadata() {
  const [names, totals] = await Promise.all([categories.get(), stats.get()]);
  return { categories: names, stats: totals };
}
export const invalidateCatalogStats = () => stats.invalidate();
