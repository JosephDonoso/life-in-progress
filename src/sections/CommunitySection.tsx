import { useState } from "react";
import { X, Users } from "lucide-react";
import type { LifeProgress } from "../hooks/useLifeProgress";
import { useCommunity } from "../hooks/useCommunity";
import { useDialogFocus } from "../hooks/useDialogFocus";
import { Avatar } from "../components/Avatar";
import { SearchField } from "../components/SearchField";
import { FriendControls } from "../components/FriendControls";
import { getPublicProfile } from "../community";
import type { PublicProfile } from "../community";
import { db } from "../service";
import { useLanguage } from "../i18n/useLanguage";
import { AchievementShowcase } from "../components/AchievementShowcase";
export function CommunitySection({ model: m }: { model: LifeProgress }) {
  const { t: tr } = useLanguage();

  const c = useCommunity(m.authenticated, m.user?.id, m.setError),
    { t, language } = useLanguage();
  const [selected, setSelected] = useState<PublicProfile | null>(null);
  useDialogFocus(selected ? "public-profile" : "", () => setSelected(null));
  async function view(id: string) {
    try {
      const p = await getPublicProfile(id);
      if (!p) {
        m.setError("Este perfil es privado o ya no está disponible.");
        return;
      }
      setSelected(p);
    } catch {
      m.setError("No pudimos cargar la comunidad.");
    }
  }
  return (
    <section className="community-section">
      <div className="community-title">
        <Users size={25} />
        <div>
          <h2>{tr("Descubre otros jugadores")}</h2>
          <p>{tr("Conecta con personas y colecciona historias.")}</p>
        </div>
      </div>
      <div className="community-toolbar">
        <div className="community-filters">
          {[
            ["all", "Explorar"],
            ["friends", "Amigos"],
            ["requests", "Solicitudes"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={c.filter === value ? "active" : ""}
              onClick={() => c.setFilter(value)}
            >
              {t(label)}
            </button>
          ))}
        </div>
        <SearchField
          label={t("Buscar jugadores")}
          placeholder={t("Buscar jugadores")}
          value={c.search}
          onChange={c.setSearch}
        />
      </div>
      {!db && (
        <p className="muted demo-community">
          {tr(
            "Perfiles de ejemplo · Las amistades de la demo se guardan en este dispositivo.",
          )}
        </p>
      )}
      {!m.authenticated && (
        <button
          className="text-button login-community"
          onClick={() => m.setModal("login")}
        >
          {tr("Inicia sesión para hacer amigos.")}
        </button>
      )}
      {c.loading ? (
        <div className="empty">{tr("Cargando comunidad…")}</div>
      ) : (
        <div className="community-grid">
          {c.players.map((p) => (
            <article className="community-card" key={p.id}>
              <Avatar
                name={p.is_public ? p.display_name : "?"}
                src={p.avatar_url}
              />
              <h3>{p.is_public ? p.display_name : t("Perfil privado")}</h3>
              {p.unlocked !== null && (
                <p>
                  {p.unlocked} {t("logros desbloqueados")}
                </p>
              )}
              <button
                className="text-button"
                disabled={!p.is_public}
                onClick={() => void view(p.id)}
              >
                {tr("Ver perfil")}
              </button>
              <FriendControls
                player={p}
                disabled={c.pending}
                onAction={(action) => {
                  if (!m.authenticated) m.setModal("login");
                  else void c.act(p.id, action);
                }}
              />
            </article>
          ))}
        </div>
      )}
      {!c.loading && !c.players.length && (
        <div className="empty">{tr("No hay jugadores para mostrar.")}</div>
      )}
      <div className="pagination community-pagination">
        <button disabled={!c.page} onClick={() => c.setPage((p) => p - 1)}>
          {tr("Anterior")}
        </button>
        <span>
          {c.page + 1} {tr("/ ")}
          {Math.max(1, Math.ceil(c.total / 12))}
        </span>
        <button
          disabled={(c.page + 1) * 12 >= c.total}
          onClick={() => c.setPage((p) => p + 1)}
        >
          {tr("Siguiente")}
        </button>
      </div>
      {selected && (
        <div className="backdrop" onClick={() => setSelected(null)}>
          <section
            className="modal public-profile"
            role="dialog"
            aria-modal="true"
            aria-label={t("Perfil de jugador")}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close"
              aria-label={t("Cerrar")}
              onClick={() => setSelected(null)}
            >
              <X />
            </button>
            <Avatar name={selected.display_name} src={selected.avatar_url} />
            <h2>{selected.display_name}</h2>
            <small>
              {new Date(selected.created_at).toLocaleDateString(
                language === "en" ? "en-US" : "es-CL",
              )}
            </small>
            <div className="profile-progress">
              <strong>{selected.unlocked}</strong>
              <span>{tr("logros desbloqueados")}</span>
            </div>
            <h3>{tr("Vitrina")}</h3>
            <AchievementShowcase
              achievements={selected.featured}
              emptyText="Sin logros destacados."
            />
          </section>
        </div>
      )}
    </section>
  );
}
