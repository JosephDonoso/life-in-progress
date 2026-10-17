import { useLanguage } from "../i18n/useLanguage";
import { ChevronRight, Trophy } from "lucide-react";
import { SignInButton } from "../components/SignInButton";
import type { LifeProgress } from "../hooks/useLifeProgress";
export function PlayerActions({ model: m }: { model: LifeProgress }) {
  const { t: tr } = useLanguage();

  return (
    <div className="action-bar">
      <div className="primary-actions">
        {m.authenticated ? (
          <button className="primary" onClick={() => m.setModal("adventure")}>
            <Trophy size={20} />
            {tr("Mi aventura ")}
          </button>
        ) : (
          <SignInButton primary onClick={() => m.setModal("login")} />
        )}
        <button
          className="secondary follow-button"
          onClick={() => m.setModal("follow")}
        >
          {tr("Seguir")}
        </button>
      </div>
      <button
        className="secondary"
        onClick={() => m.setModal(m.authenticated ? "profile" : "login")}
      >
        {tr("Ver tu perfil ")}
        <ChevronRight size={22} />
      </button>
    </div>
  );
}
