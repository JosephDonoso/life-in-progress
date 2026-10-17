import type { LifeProgress } from "../hooks/useLifeProgress";
import { useCatalog } from "../hooks/useCatalog";
import { useLanguage } from "../i18n/useLanguage";
import { Avatar } from "../components/Avatar";
import { ProgressBar } from "../components/ProgressBar";
import { SearchField } from "../components/SearchField";
import { AdventureAchievementRow } from "../components/AdventureAchievementRow";
export function AdventureSection({ model: m }: { model: LifeProgress }) {
  const { t, language } = useLanguage();
  const list = useCatalog(
    m.progress,
    m.retry,
    m.setError,
    "popular",
    true,
    m.user?.id,
  );
  return (
    <div className="adventure-section">
      <header className="adventure-header">
        <div className="adventure-title">
          <Avatar name={m.name} src={m.avatar} />
          <div>
            <h2>Life in Progress</h2>
            <small>
              {t("Mi aventura")} · {m.name}
            </small>
          </div>
        </div>
        <div className="adventure-progress">
          <div>
            <span>
              {t("Logros conseguidos:")} {m.completed} {t("de")}{" "}
              {m.stats.achievements}
            </span>
            <b>
              {m.percentage.toLocaleString(
                language === "en" ? "en-US" : "es-CL",
                { maximumFractionDigits: 1 },
              )}
              %
            </b>
          </div>
          <ProgressBar value={m.percentage} />
        </div>
      </header>
      <div
        className="tabs adventure-tabs"
        role="tablist"
        aria-label={t("Vista de logros")}
      >
        <button
          role="tab"
          aria-selected={list.status === "unlocked"}
          className={list.status === "unlocked" ? "active" : ""}
          onClick={() => list.setStatus("unlocked")}
        >
          {t("Mis logros")}
        </button>
        <button
          role="tab"
          aria-selected={list.status === "all"}
          className={list.status === "all" ? "active" : ""}
          onClick={() => list.setStatus("all")}
        >
          {t("Logros globales")}
        </button>
      </div>
      <div className="adventure-list-heading">
        <SearchField
          label={t("Buscar en mi aventura")}
          value={list.query}
          onChange={list.setQuery}
        />
        <span>{t("% de todos los jugadores")}</span>
      </div>
      <div className="adventure-list" aria-busy={list.loading}>
        {list.loading && !list.items.length ? (
          <div className="empty">{t("Cargando experiencias…")}</div>
        ) : list.items.length ? (
          list.items.map((a) => (
            <AdventureAchievementRow
              key={a.id}
              achievement={a}
              unlocked={m.progress.unlocked.includes(a.id)}
              disabled={m.pending || !m.profileReady}
              onToggle={() => m.toggle(a.id)}
            />
          ))
        ) : (
          <div className="empty">
            <p>{t("No hay experiencias con estos filtros.")}</p>
            {list.query && (
              <button className="text-button" onClick={() => list.setQuery("")}>
                {t("Limpiar filtros")}
              </button>
            )}
          </div>
        )}
        {list.items.length < list.count && (
          <div className="adventure-load-more">
            <button
              className="load-more"
              disabled={list.loading}
              onClick={list.loadMore}
            >
              {t(list.loading ? "Cargando…" : "Ver más")}
            </button>
          </div>
        )}
      </div>
      <div className="adventure-footer">
        <span>{t("Del más al menos conseguido")}</span>
        <span aria-live="polite">
          {list.items.length} {t("de")} {list.count}
        </span>
      </div>
    </div>
  );
}
