import type { CommunityPlayer, FriendAction } from "../community";
import { useLanguage } from "../i18n/useLanguage";
export function FriendControls({
  player: p,
  disabled,
  onAction,
}: {
  player: CommunityPlayer;
  disabled: boolean;
  onAction: (action: FriendAction) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="friend-controls">
      {p.relationship === "none" ? (
        <button
          className="secondary"
          disabled={disabled || !p.is_public}
          onClick={() => onAction("request")}
        >
          {t("Añadir amigo")}
        </button>
      ) : p.relationship === "incoming" ? (
        <>
          <button
            className="secondary"
            disabled={disabled}
            onClick={() => onAction("accept")}
          >
            {t("Aceptar")}
          </button>
          <button
            className="text-button"
            disabled={disabled}
            onClick={() => onAction("decline")}
          >
            {t("Rechazar")}
          </button>
        </>
      ) : p.relationship === "outgoing" ? (
        <>
          <small>{t("Solicitud enviada")}</small>
          <button
            className="text-button"
            disabled={disabled}
            onClick={() => onAction("cancel")}
          >
            {t("Cancelar solicitud")}
          </button>
        </>
      ) : (
        <>
          <span className="friend-badge">{t("Amigos")}</span>
          <button
            className="text-button"
            disabled={disabled}
            onClick={() => onAction("remove")}
          >
            {t("Eliminar amigo")}
          </button>
        </>
      )}
    </div>
  );
}
