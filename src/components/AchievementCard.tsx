import { useLanguage } from "../i18n/useLanguage";
import { Star } from "lucide-react";
import { AchievementIcon } from "./AchievementIcon";
import { achievementRarity } from "../data";
import type { Achievement } from "../data";
type Props = {
  achievement: Achievement;
  unlocked: boolean;
  featured: boolean;
  disabled: boolean;
  onToggle: () => void;
  onFeature: () => void;
};
export function AchievementCard({
  achievement: a,
  unlocked,
  featured,
  disabled,
  onToggle,
  onFeature,
}: Props) {
  const { t: tr, language } = useLanguage();

  return (
    <article
      data-rarity={achievementRarity(a)}
      className={`achievement ${unlocked ? "unlocked" : ""}`}
    >
      <button
        className="achievement-main"
        disabled={disabled}
        onClick={onToggle}
        aria-label={`${tr(unlocked ? "Desmarcar" : "Desbloquear")} ${tr(a.name)}`}
        aria-pressed={unlocked}
      >
        <AchievementIcon icon={a.icon} />
        <div className="achievement-copy">
          <h3>{tr(a.name)}</h3>
          <p>{tr(a.description)}</p>
          <div className="achievement-meta">
            <span className="rarity">{tr(achievementRarity(a))}</span>
            <span>
              <b>
                {a.percentage.toLocaleString(
                  language === "en" ? "en-US" : "es-CL",
                  {
                    maximumFractionDigits: 2,
                  },
                )}
                {tr("% ")}
              </b>{" "}
              {tr("de jugadores ")}
            </span>
          </div>
        </div>
      </button>
      {unlocked && (
        <button
          className={`favorite ${featured ? "on" : ""}`}
          disabled={disabled}
          aria-label={`${tr("Destacar")} ${tr(a.name)}`}
          aria-pressed={featured}
          onClick={onFeature}
        >
          <Star size={14} />
        </button>
      )}
    </article>
  );
}
