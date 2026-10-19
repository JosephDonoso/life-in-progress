import { useLanguage } from "../i18n/useLanguage";
import { Trophy, ChevronRight } from "lucide-react";
import type { LifeProgress } from "../hooks/useLifeProgress";
import { rarities, achievementRarity } from "../data";
import { db } from "../service";
import { Panel } from "../components/Panel";
import { ProgressBar } from "../components/ProgressBar";
import { Avatar } from "../components/Avatar";
import { CategoryIcon } from "../components/CategoryIcon";
export function PlayerSidebar({ model: m }: { model: LifeProgress }) {
  const { t: tr } = useLanguage();

  return (
    <aside className="sidebar">
      <Panel
        title={tr("Tu progreso")}
        action={
          <button
            onClick={() => m.setModal(m.authenticated ? "profile" : "login")}
          >
            {tr("Ver todas ")}
          </button>
        }
      >
        <div className="player">
          <Avatar
            name={m.authenticated ? m.name : ""}
            src={m.authenticated ? m.avatar : null}
          />
          <div>
            <strong>{m.authenticated ? m.name : tr("Jugador")}</strong>
            <small>
              {m.completed} {tr("de ")}
              {m.stats.achievements} {tr("logros ( ")}
              {m.percentage.toFixed(1)}
              {tr("%) ")}
            </small>
            <ProgressBar value={m.percentage} />
          </div>
        </div>
        <div className="rarity-grid">
          {rarities.map((r) => (
            <div key={r} data-rarity={r}>
              <Trophy size={21} />
              <span>{tr(r)}</span>
              <b>
                {db
                  ? m.personal?.distribution[r] || 0
                  : m.all.filter(
                      (a) =>
                        m.progress.unlocked.includes(a.id) &&
                        achievementRarity(a) === r,
                    ).length}
              </b>
            </div>
          ))}
        </div>
      </Panel>
      <Panel
        title={tr("Categorías")}
        className="categories"
        action={
          <button onClick={() => m.setCategory("")}>{tr("Ver todas")}</button>
        }
      >
        {m.categories.map((c) => (
          <button
            key={tr(c)}
            className={m.category === c ? "chosen" : ""}
            onClick={() => {
              m.setCategory(c);
              m.setTab("Logros");
            }}
          >
            <span className="category-symbol" aria-hidden="true">
              <CategoryIcon name={c} />
            </span>
            <span>{tr(c)}</span>
            <ChevronRight size={15} />
          </button>
        ))}
      </Panel>
    </aside>
  );
}
