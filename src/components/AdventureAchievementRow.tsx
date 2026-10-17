import type { Achievement } from "../data";
import { achievementRarity } from "../data";
import { AchievementIcon } from "./AchievementIcon";
import { useLanguage } from "../i18n/useLanguage";
export function AdventureAchievementRow({
  achievement: a,
  unlocked,
  disabled,
  onToggle,
}: {
  achievement: Achievement;
  unlocked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const { t, language } = useLanguage();
  return (
    <button
      className={`achievement adventure-row ${unlocked ? "unlocked" : ""}`}
      data-rarity={achievementRarity(a)}
      data-percentage={a.percentage}
      disabled={disabled}
      aria-pressed={unlocked}
      aria-label={`${t(unlocked ? "Desmarcar" : "Desbloquear")} ${t(a.name)}`}
      onClick={onToggle}
    >
      <span
        className="adventure-proportion"
        style={{ width: `${Math.min(100, Math.max(0, a.percentage))}%` }}
        aria-hidden="true"
      />
      <AchievementIcon icon={a.icon} />
      <div className="achievement-copy">
        <div className="adventure-row-heading">
          <h3>{t(a.name)}</h3>
          <span className="rarity">{t(achievementRarity(a))}</span>
        </div>
        <p>{t(a.description)}</p>
      </div>
      <strong
        className="adventure-percentage"
        aria-label={t("Porcentaje global")}
      >
        {a.percentage.toLocaleString(language === "en" ? "en-US" : "es-CL", {
          maximumFractionDigits: 2,
        })}
        %
      </strong>
    </button>
  );
}
