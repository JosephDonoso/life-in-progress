import { useLanguage } from "../i18n/useLanguage";
import { ChevronRight, Search } from "lucide-react";
import type { LifeProgress } from "../hooks/useLifeProgress";
import { rarities } from "../data";
import { AchievementCard } from "../components/AchievementCard";
import { SearchField } from "../components/SearchField";
import { ProgressBar } from "../components/ProgressBar";
import { StatisticsSection } from "./StatisticsSection";
import { CommunitySection } from "./CommunitySection";
import { CatalogSort } from "../components/CatalogSort";
export function AchievementCatalog({ model: m }: { model: LifeProgress }) {
  const { t: tr } = useLanguage();

  return (
    <section className="catalog" id="catalog">
      <div
        className="tabs"
        role="tablist"
        aria-label={tr("Contenido del catálogo")}
      >
        {["Logros", "Estadísticas", "Comunidad"].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={m.tab === t}
            className={m.tab === t ? "active" : ""}
            onClick={() => m.setTab(t)}
          >
            {tr(t).toUpperCase()}
          </button>
        ))}
      </div>
      {m.tab === "Logros" ? (
        <>
          <div className="catalog-toolbar">
            <h2>{tr("Logros")}</h2>
            <div className="progress-summary">
              <p>
                {m.completed} {tr("de ")}
                {m.stats.achievements} {tr("logros desbloqueados ( ")}
                {m.percentage.toFixed(1)}
                {tr("%) ")}
              </p>
              <ProgressBar value={m.percentage} />
            </div>
            <div className="filters">
              <SearchField
                label={tr("Buscar en el catálogo")}
                value={m.query}
                onChange={m.setQuery}
              />
              <select
                aria-label={tr("Rareza")}
                value={m.rare}
                onChange={(e) => m.setRare(e.target.value)}
              >
                <option value="">{tr("Rareza")}</option>
                {rarities.map((r) => (
                  <option key={r} value={r}>
                    {tr(r)}
                  </option>
                ))}
              </select>
              <select
                aria-label={tr("Categoría")}
                value={m.category}
                onChange={(e) => m.setCategory(e.target.value)}
              >
                <option value="">{tr("Categoría")}</option>
                {m.categories.map((c) => (
                  <option key={c} value={c}>
                    {tr(c)}
                  </option>
                ))}
              </select>
              <CatalogSort value={m.sort} onChange={m.setSort} />
            </div>
          </div>
          {m.loading ? (
            <div className="empty">{tr("Cargando experiencias…")}</div>
          ) : (
            <div className="achievement-grid">
              {m.items.map((a) => (
                <AchievementCard
                  key={a.id}
                  achievement={a}
                  unlocked={m.progress.unlocked.includes(a.id)}
                  featured={m.progress.featured.includes(a.id)}
                  disabled={m.pending || (m.authenticated && !m.profileReady)}
                  onToggle={() => m.toggle(a.id)}
                  onFeature={() =>
                    void m.save({
                      ...m.progress,
                      featured: m.progress.featured.includes(a.id)
                        ? m.progress.featured.filter((x) => x !== a.id)
                        : [...m.progress.featured.slice(-2), a.id],
                    })
                  }
                />
              ))}
            </div>
          )}
          {!m.loading && !m.items.length && (
            <div className="empty">
              <Search />
              <h3>{tr("No hay experiencias con estos filtros.")}</h3>
              <button
                className="secondary"
                onClick={() => {
                  m.setQuery("");
                  m.setCategory("");
                  m.setRare("");
                  m.setStatus("all");
                }}
              >
                {tr("Limpiar filtros ")}
              </button>
            </div>
          )}
          <div className="catalog-bottom">
            <select
              aria-label={tr("Estado de los logros")}
              value={m.status}
              onChange={(e) => m.setStatus(e.target.value)}
            >
              <option value="all">{tr("Todos los logros")}</option>
              <option value="unlocked">{tr("Desbloqueados")}</option>
              <option value="locked">{tr("Por descubrir")}</option>
            </select>
            <div className="pagination">
              <button
                disabled={!m.page || m.loading}
                onClick={() => m.setPage((p) => p - 1)}
              >
                {tr("Anterior ")}
              </button>
              <span>
                {m.page + 1} {tr("/ ")}
                {Math.max(1, Math.ceil(m.count / 12))}
              </span>
              <button
                disabled={(m.page + 1) * 12 >= m.count || m.loading}
                onClick={() => m.setPage((p) => p + 1)}
              >
                {tr("Siguiente ")}
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      ) : m.tab === "Comunidad" ? (
        <CommunitySection model={m} />
      ) : (
        <StatisticsSection model={m} />
      )}
    </section>
  );
}
