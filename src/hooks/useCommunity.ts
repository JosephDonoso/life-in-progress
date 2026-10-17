import { useEffect, useState } from "react";
import { listCommunity, changeFriendship } from "../community";
import type { CommunityPlayer, FriendAction } from "../community";
import { useDebouncedValue } from "./useDebouncedValue";
export function useCommunity(
  authenticated: boolean,
  userId: string | undefined,
  onError: (message: string) => void,
) {
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [page, setPage] = useState(0),
    [players, setPlayers] = useState<CommunityPlayer[]>([]),
    [total, setTotal] = useState(0),
    [loading, setLoading] = useState(true),
    [pending, setPending] = useState(false),
    [revision, setRevision] = useState(0);
  const searchText = search.trim();
  const settledSearch = useDebouncedValue(searchText);
  const key = JSON.stringify([settledSearch, filter]),
    [oldKey, setOldKey] = useState(key);
  if (oldKey !== key) {
    setOldKey(key);
    setPage(0);
  }
  useEffect(() => {
    if (searchText !== settledSearch) return;
    const controller = new AbortController();
    let active = true;
    async function load() {
      setLoading(true);
      await listCommunity(
        settledSearch,
        filter,
        page,
        authenticated,
        controller.signal,
      )
        .then((data) => {
          if (active) {
            setPlayers(data.items);
            setTotal(data.total);
          }
        })
        .catch(() => {
          if (active) onError("No pudimos cargar la comunidad.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [
    searchText,
    settledSearch,
    filter,
    page,
    authenticated,
    userId,
    revision,
    onError,
  ]);
  async function act(id: string, action: FriendAction) {
    if (pending) return;
    setPending(true);
    try {
      await changeFriendship(id, action);
      setRevision((r) => r + 1);
    } catch {
      onError("No se pudo actualizar la amistad.");
    } finally {
      setPending(false);
    }
  }
  return {
    search,
    setSearch,
    filter,
    setFilter,
    page,
    setPage,
    players,
    total,
    loading,
    pending,
    act,
  };
}
