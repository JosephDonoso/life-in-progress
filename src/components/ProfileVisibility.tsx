import { Globe2, LockKeyhole } from "lucide-react";
import type { LifeProgress } from "../hooks/useLifeProgress";
import { useLanguage } from "../i18n/useLanguage";
export function ProfileVisibility({ model: m }: { model: LifeProgress }) {
  const { t } = useLanguage();
  return (
    <div className="profile-visibility">
      <button
        className={`secondary visibility-switch ${m.progress.public ? "is-public" : ""}`}
        role="switch"
        aria-label={t("Perfil público")}
        aria-checked={m.progress.public}
        disabled={m.pending || !m.profileReady}
        onClick={() =>
          void m.save({ ...m.progress, public: !m.progress.public })
        }
      >
        {m.progress.public ? <Globe2 size={18} /> : <LockKeyhole size={18} />}
        <span>
          {t(m.progress.public ? "Perfil público" : "Perfil privado")}
        </span>
        <span className="switch-track" aria-hidden="true">
          <i />
        </span>
      </button>
      <small>
        {t(
          "Tus experiencias individuales permanecen privadas; solo compartes tu progreso total y la vitrina que eliges.",
        )}
      </small>
    </div>
  );
}
