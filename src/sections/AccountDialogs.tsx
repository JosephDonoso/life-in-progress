import { useLanguage } from "../i18n/useLanguage";
import { X, LogOut } from "lucide-react";
import { EmailAuthPanel } from "../components/EmailAuthPanel";
import { PasswordResetForm } from "../components/PasswordResetForm";
import { AchievementShowcase } from "../components/AchievementShowcase";
import { ProfileVisibility } from "../components/ProfileVisibility";
import { db } from "../service";
import type { LifeProgress } from "../hooks/useLifeProgress";
import { useDialogFocus } from "../hooks/useDialogFocus";
import { ProfileEditor } from "../components/ProfileEditor";
import { FollowLinks } from "../components/FollowLinks";
import { Avatar } from "../components/Avatar";
import { AdventureSection } from "./AdventureSection";
export function AccountDialogs({ model }: { model: LifeProgress }) {
  const { t: tr, language } = useLanguage();

  const {
    modal,
    setModal,
    login,
    name,
    user,
    completed,
    percentage,
    setError,
    setDemoUser,
  } = model;
  useDialogFocus(modal, setModal);
  return (
    <>
      {modal && (
        <div className="backdrop" onClick={() => setModal("")}>
          <section
            className={`modal ${modal === "adventure" ? "adventure-modal" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label={tr(
              modal === "login"
                ? "Iniciar sesión"
                : modal === "reset-password"
                  ? "Nueva contraseña"
                  : modal === "follow"
                    ? "Sigue el proyecto"
                    : modal === "adventure"
                      ? "Mi aventura"
                      : modal === "profile"
                        ? "Mi perfil"
                        : "Acerca del proyecto",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close"
              aria-label={tr("Cerrar")}
              onClick={() => setModal("")}
            >
              <X />
            </button>
            {modal === "login" ? (
              <EmailAuthPanel
                onAuthenticated={() => setModal("")}
                onGoogle={() => void login()}
                onDemo={() => void login()}
              />
            ) : modal === "reset-password" ? (
              <PasswordResetForm />
            ) : modal === "adventure" ? (
              <AdventureSection model={model} />
            ) : modal === "follow" ? (
              <FollowLinks />
            ) : modal === "about" ? (
              <>
                <span className="eyebrow">
                  {tr("ACERCA DE LIFE IN PROGRESS")}
                </span>
                <p>
                  {tr(
                    "Soy Joseph Donoso y creé Life in Progress como un pasatiempo: una forma de experimentar con el desarrollo web y darle vida a una idea que me pareció interesante. ¿Cómo serían los logros de un videojuego si hablaran de las experiencias de nuestra vida?",
                  )}
                </p>
                <p>
                  {tr(
                    "De esa curiosidad nació este proyecto: un espacio para recordar momentos, reconocer lo que ya hemos vivido y descubrir experiencias en común con otras personas. Lo construyo en mi tiempo libre, con ganas de aprender, probar ideas y ver hasta dónde puede llegar.",
                  )}
                </p>
                <p>
                  {tr(
                    "Proyecto independiente, sin afiliación con Steam o Valve. Fotografías ilustrativas de Unsplash. ",
                  )}
                </p>
              </>
            ) : (
              <>
                <div className="profile-title">
                  <Avatar name={name} src={model.avatar} />
                  <div>
                    <h2>{name}</h2>
                    <small>
                      {user
                        ? `${tr("Jugador desde")} ${new Date(user.created_at).toLocaleDateString(language === "en" ? "en-US" : "es-CL")}`
                        : tr("Perfil de demostración local")}
                    </small>
                  </div>
                </div>
                <ProfileVisibility model={model} />
                <ProfileEditor model={model} />
                <div className="profile-progress">
                  <strong>{completed}</strong>
                  <span>
                    {tr("experiencias desbloqueadas · ")}
                    {percentage.toFixed(1)}
                    {tr("% ")}
                  </span>
                </div>
                <h3>{tr("Mi vitrina")}</h3>
                <AchievementShowcase
                  achievements={model.featuredAchievements}
                  emptyText="Desbloquea un logro y pulsa su estrella para destacarlo aquí."
                />
                <button
                  className="secondary"
                  onClick={async () => {
                    if (db) {
                      const { error } = await db.auth.signOut();
                      if (error) {
                        setError(error.message);
                        return;
                      }
                    }
                    setDemoUser(false);
                    setModal("");
                  }}
                >
                  <LogOut size={16} /> {tr("Cerrar sesión ")}
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
