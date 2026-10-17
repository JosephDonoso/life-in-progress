import { useLanguage } from "../i18n/useLanguage";
import { ChevronRight } from "lucide-react";
import { db } from "../service";
import type { LifeProgress } from "../hooks/useLifeProgress";
export function StatisticsSection({ model }: { model: LifeProgress }) {
  const { t: tr, language } = useLanguage();

  const {
    stats,
    completed,
    percentage,
    rarest,
    categoryProgress,
    setTab,
    setStatus,
  } = model;
  return (
    <div className="stats-page">
      <span className="eyebrow">{tr("UNA COMUNIDAD DE HISTORIAS")}</span>
      <h2>{tr("Cada vida deja su huella.")}</h2>
      <div className="stat-boxes">
        {[
          [stats.achievements, "Experiencias"],
          [stats.players, "Jugadores"],
          [stats.unlocks, "Desbloqueos"],
        ].map(([n, label]) => (
          <div key={tr(label)}>
            <strong>
              {n.toLocaleString(language === "en" ? "en-US" : "es-CL")}
            </strong>
            <span>{tr(label)}</span>
          </div>
        ))}
      </div>
      <p>
        {tr(
          db
            ? "Estadísticas preliminares calculadas sobre los usuarios registrados."
            : "Datos ilustrativos de demostración. Al conectar Supabase se utilizarán únicamente datos reales.",
        )}
      </p>
      <h3>{tr("Tu historia hasta ahora")}</h3>
      <p>
        {completed} {tr("experiencias desbloqueadas · ")}
        {percentage.toFixed(1)}
        {tr("% del catálogo. ")}
      </p>
      {rarest && (
        <p>
          {tr("Tu logro más raro: ")}
          <b>{tr(rarest.name)}</b> {tr("·")} {rarest.percentage.toFixed(2)}
          {tr("% de jugadores. ")}
        </p>
      )}
      <h3>{tr("Progreso por categoría")}</h3>
      <div className="category-progress">
        {categoryProgress.map((c) => (
          <div key={tr(c.name)}>
            <div>
              <span>{tr(c.name)}</span>
              <b>
                {c.unlocked} {tr("/ ")}
                {c.total}
              </b>
            </div>
            <div className="track">
              <i
                style={{
                  width: `${c.total ? (c.unlocked / c.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <button
        className="secondary"
        onClick={() => {
          setTab("Logros");
          setStatus("unlocked");
        }}
      >
        {tr("Ver mis logros ")}
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
