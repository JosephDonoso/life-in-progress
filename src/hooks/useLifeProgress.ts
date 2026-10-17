import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { demo } from "../data";
import { useCatalog } from "./useCatalog";
import { db, empty, localProgress } from "../service";
import type { Progress, PlayerState } from "../service";
import { persistProfile, readLocalProfile } from "../profile";
import type { EditableProfile } from "../profile";
import { invalidateCatalogStats } from "../catalogMetadata";
export function useLifeProgress() {
  const [profile, setProfile] = useState<EditableProfile | null>(
    db ? null : readLocalProfile,
  );
  const [profileSaving, setProfileSaving] = useState(false);
  const [personal, setPersonal] = useState<PlayerState | null>(null);
  const [profileReady, setProfileReady] = useState(!db);
  const sessionUserId = useRef<string | null>(null);
  const [profileRetry, setProfileRetry] = useState(0);
  const [user, setUser] = useState<User | null>(null),
    [demoUser, setDemoUser] = useState(false),
    [progress, setProgress] = useState<Progress>(db ? empty : localProgress);
  const [tab, setTab] = useState("Logros"),
    [modal, setModal] = useState(""),
    [error, setError] = useState(""),
    [pending, setPending] = useState(false),
    [retry, setRetry] = useState(0);
  const {
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
  } = useCatalog(progress, retry, setError, "catalog", false, user?.id);
  const userId = user?.id;
  const authenticated = !!user || demoUser,
    name: string =
      profile?.display_name || user?.user_metadata.full_name || "Explorador",
    completed = progress.unlocked.length,
    percentage = stats.achievements
      ? (completed / stats.achievements) * 100
      : 0;

  useEffect(() => {
    if (!db) return;
    const client = db;
    let active = true;
    function applyUser(next: User | null) {
      if (!active) return;
      const id = next?.id || null;
      if (id !== sessionUserId.current) {
        sessionUserId.current = id;
        invalidateCatalogStats();
        setProfile(null);
        setProgress(empty);
        setPersonal(null);
        setProfileReady(false);
      }
      setUser(next);
    }
    client.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setError(error.message);
      applyUser(data.session?.user || null);
    });
    const { data } = client.auth.onAuthStateChange((event, session) => {
      applyUser(session?.user || null);
      if (event === "PASSWORD_RECOVERY") setModal("reset-password");
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!db) return;
    if (!userId) return;
    const controller = new AbortController();
    let active = true;
    Promise.all([
      db.rpc("player_state").abortSignal(controller.signal),
      db
        .from("profiles")
        .select("display_name,avatar_url")
        .eq("id", userId)
        .abortSignal(controller.signal)
        .single(),
    ]).then(([{ data, error }, account]) => {
      if (!active) return;
      if (error || account.error) {
        setError("No pudimos cargar tu perfil.");
        return;
      }
      setPersonal(data);
      setProfile(account.data);
      setProgress({
        unlocked: data.unlocked,
        featured: data.featured,
        public: data.public,
      });
      setProfileReady(true);
    });
    return () => {
      active = false;
      controller.abort();
    };
  }, [userId, profileRetry]);
  function reload() {
    if (db) setProfileReady(false);
    invalidateCatalogStats();
    setRetry((r) => r + 1);
    setProfileRetry((r) => r + 1);
  }
  async function editProfile(next: EditableProfile, file: File | null) {
    if (!authenticated || profileSaving) return false;
    setProfileSaving(true);
    try {
      setProfile(await persistProfile(next, file, user?.id));
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo guardar el perfil.",
      );
      return false;
    } finally {
      setProfileSaving(false);
    }
  }
  async function save(next: Progress, id?: string) {
    if (pending || !profileReady) return;
    const old = progress;
    setProgress(next);
    setPending(true);
    try {
      if (!db) localStorage.setItem("lip-progress", JSON.stringify(next));
      else if (user) {
        if (id) {
          const result = next.unlocked.includes(id)
            ? await db
                .from("user_achievements")
                .upsert(
                  { user_id: user.id, achievement_id: id },
                  { onConflict: "user_id,achievement_id" },
                )
            : await db
                .from("user_achievements")
                .delete()
                .eq("user_id", user.id)
                .eq("achievement_id", id);
          if (result.error) throw result.error;
        } else {
          const { error } = await db.rpc("update_profile", {
            public_profile: next.public,
            favorites: next.featured,
          });
          if (error) throw error;
        }
        if (id) invalidateCatalogStats();
        const state = await db.rpc("player_state");
        if (sessionUserId.current !== user.id) return;
        let unlocksChanged = false;
        if (state.error)
          setError(
            "El cambio se guardó, pero las estadísticas no se pudieron actualizar.",
          );
        else {
          unlocksChanged =
            JSON.stringify(state.data.unlocked) !==
            JSON.stringify(next.unlocked);
          setPersonal(state.data);
          setProgress({
            unlocked: state.data.unlocked,
            featured: state.data.featured,
            public: state.data.public,
          });
        }
        if (unlocksChanged && !id) invalidateCatalogStats();
        if (id || unlocksChanged) setRetry((r) => r + 1);
      }
    } catch {
      if (!db || sessionUserId.current === user?.id) {
        setProgress(old);
        setError("No se guardó el cambio. Inténtalo nuevamente.");
      }
    } finally {
      setPending(false);
    }
  }
  function toggle(id: string) {
    if (!authenticated) {
      setModal("login");
      return;
    }
    const has = progress.unlocked.includes(id);
    void save(
      {
        ...progress,
        unlocked: has
          ? progress.unlocked.filter((x) => x !== id)
          : [...progress.unlocked, id],
        featured: has
          ? progress.featured.filter((x) => x !== id)
          : progress.featured,
      },
      id,
    );
  }
  async function login() {
    if (!db) {
      setDemoUser(true);
      setModal("");
      return;
    }
    const { error } = await db.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: new URL(".", location.href).href,
      },
    });
    if (error) setError(error.message);
  }
  const all = db ? items : demo;
  const categoryProgress = db
    ? personal?.categories || []
    : categories.map((c) => ({
        name: c,
        total: demo.filter((a) => a.category === c).length,
        unlocked: demo.filter(
          (a) => a.category === c && progress.unlocked.includes(a.id),
        ).length,
      }));
  const rarest = db
    ? personal?.rarest
    : demo
        .filter((a) => progress.unlocked.includes(a.id))
        .sort((a, b) => a.percentage - b.percentage)[0];

  return {
    featuredAchievements: db
      ? personal?.featured_details || []
      : progress.featured.flatMap((id) => demo.filter((a) => a.id === id)),
    profile,
    profileSaving,
    editProfile,
    avatar: profile?.avatar_url || null,
    personal,
    profileReady,
    user,
    demoUser,
    setDemoUser,
    progress,
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
    tab,
    setTab,
    modal,
    setModal,
    error,
    setError,
    loading,
    pending,
    retry,
    setRetry,
    reload,
    authenticated,
    name,
    completed,
    percentage,
    save,
    toggle,
    login,
    all,
    categoryProgress,
    rarest,
  };
}
export type LifeProgress = ReturnType<typeof useLifeProgress>;
