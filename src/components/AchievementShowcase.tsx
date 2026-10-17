import { useId, useState } from "react";
import type { Achievement } from "../data";
import { achievementRarity } from "../data";
import { useLanguage } from "../i18n/useLanguage";
import { AchievementIcon } from "./AchievementIcon";
function ShowcaseItem({ achievement: a }: { achievement: Achievement }) {
  const { t, language } = useLanguage(),
    id = useId(),
    [expanded, setExpanded] = useState(false);
  const name =
    language === "en" ? a.translations?.en?.name || t(a.name) : a.name;
  const description =
    language === "en"
      ? a.translations?.en?.description || t(a.description)
      : a.description;
  const rare = achievementRarity(a);
  return (
    <div className="showcase-item">
      <button
        className="achievement unlocked achievement-mini"
        data-rarity={rare}
        aria-label={`${name} · ${t(rare)}`}
        aria-describedby={id}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        onBlur={() => setExpanded(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            setExpanded(false);
          }
        }}
      >
        <AchievementIcon icon={a.icon} />
        <span className="rarity">{t(rare)}</span>
      </button>
      <div className="achievement-tooltip" id={id} role="tooltip">
        <strong>{name}</strong>
        <p>{description}</p>
        <span>
          {t(rare)} ·{" "}
          {a.percentage.toLocaleString(language === "en" ? "en-US" : "es-CL", {
            maximumFractionDigits: 2,
          })}
          %
        </span>
      </div>
    </div>
  );
}
export function AchievementShowcase({
  achievements,
  emptyText,
}: {
  achievements: Achievement[];
  emptyText: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="achievement-showcase">
      {achievements.length ? (
        achievements.map((a) => <ShowcaseItem key={a.id} achievement={a} />)
      ) : (
        <p>{t(emptyText)}</p>
      )}
    </div>
  );
}
