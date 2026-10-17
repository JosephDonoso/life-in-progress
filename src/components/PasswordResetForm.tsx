import { useState } from "react";
import { db } from "../service";
import { authErrorMessage } from "../auth";
import { useLanguage } from "../i18n/useLanguage";
export function PasswordResetForm() {
  const { t } = useLanguage(),
    [password, setPassword] = useState(""),
    [repeat, setRepeat] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  return (
    <div>
      <h2>{t("Nueva contraseña")}</h2>
      {saved ? (
        <p role="status">
          {t("Contraseña actualizada. Ya puedes continuar con tu aventura.")}
        </p>
      ) : (
        <form
          className="auth-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!db || busy) return;
            setError("");
            if (password !== repeat) {
              setError("Las contraseñas no coinciden.");
              return;
            }
            setBusy(true);
            try {
              const { error } = await db.auth.updateUser({ password });
              if (error) setError(authErrorMessage(error));
              else {
                setPassword("");
                setRepeat("");
                setSaved(true);
              }
            } catch {
              setError(
                "No se pudo completar la operación. Inténtalo nuevamente.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            {t("Nueva contraseña")}
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
            />
          </label>
          <label>
            {t("Repetir contraseña")}
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              disabled={busy}
            />
          </label>
          {error && (
            <div className="auth-feedback auth-error" role="alert">
              {t(error)}
            </div>
          )}
          <button className="primary auth-submit" type="submit" disabled={busy}>
            {t(busy ? "Procesando…" : "Guardar contraseña")}
          </button>
        </form>
      )}
    </div>
  );
}
