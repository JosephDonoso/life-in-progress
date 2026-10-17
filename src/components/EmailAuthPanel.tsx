import { useState } from "react";
import type { FormEvent } from "react";
import { db } from "../service";
import { authErrorMessage, authReturnUrl } from "../auth";
import { useLanguage } from "../i18n/useLanguage";
import { GoogleMark } from "./GoogleButton";
type Mode = "signin" | "signup" | "recover";
export function EmailAuthPanel({
  onAuthenticated,
  onGoogle,
  onDemo,
}: {
  onAuthenticated: () => void;
  onGoogle: () => void;
  onDemo: () => void;
}) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>("signin"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [repeat, setRepeat] = useState(""),
    [name, setName] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  function change(next: Mode) {
    setMode(next);
    setError("");
    setMessage("");
    setPassword("");
    setRepeat("");
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!db || busy) return;
    setError("");
    setMessage("");
    if (mode === "signup" && password !== repeat) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (
      mode === "signup" &&
      (name.trim().length < 2 || name.trim().length > 40)
    ) {
      setError("El nombre debe tener entre 2 y 40 caracteres.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await db.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          setError(authErrorMessage(error));
          return;
        }
        setPassword("");
        onAuthenticated();
      } else if (mode === "signup") {
        const { data, error } = await db.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: authReturnUrl(),
          },
        });
        if (error) {
          setError(authErrorMessage(error));
          return;
        }
        setPassword("");
        setRepeat("");
        if (data.session) onAuthenticated();
        else
          setMessage(
            "Revisa tu correo para confirmar la cuenta. Después podrás iniciar sesión.",
          );
      } else {
        const { error } = await db.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: authReturnUrl(),
        });
        if (error) {
          setError(authErrorMessage(error));
          return;
        }
        setMessage(
          "Si existe una cuenta con ese correo, recibirás un enlace para restablecer la contraseña.",
        );
      }
    } catch {
      setError("No se pudo completar la operación. Inténtalo nuevamente.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="email-auth">
      <h2>
        {t(
          mode === "signup"
            ? "Crea tu cuenta"
            : mode === "recover"
              ? "Recuperar contraseña"
              : "Tu historia empieza contigo.",
        )}
      </h2>
      <p>
        {t(
          mode === "recover"
            ? "Te enviaremos un enlace para elegir una nueva contraseña."
            : "Guarda tus experiencias y descubre todo lo que ya has vivido.",
        )}
      </p>
      {db ? (
        <>
          <div
            className="auth-tabs"
            role="tablist"
            aria-label={t("Acceso a tu cuenta")}
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signin"}
              onClick={() => change("signin")}
              disabled={busy}
            >
              {t("Iniciar sesión")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              onClick={() => change("signup")}
              disabled={busy}
            >
              {t("Crear cuenta")}
            </button>
          </div>
          <form className="auth-form" onSubmit={submit}>
            {mode === "signup" && (
              <label>
                {t("Nombre visible")}
                <input
                  aria-label={t("Nombre visible")}
                  required
                  minLength={2}
                  maxLength={40}
                  autoComplete="nickname"
                  value={name}
                  disabled={busy}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            )}
            <label>
              {t("Correo electrónico")}
              <input
                aria-label={t("Correo electrónico")}
                type="email"
                required
                autoComplete="email"
                value={email}
                disabled={busy}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {mode !== "recover" && (
              <label>
                {t("Contraseña")}
                <input
                  aria-label={t("Contraseña")}
                  type="password"
                  required
                  minLength={mode === "signup" ? 8 : undefined}
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  value={password}
                  disabled={busy}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            )}
            {mode === "signup" && (
              <>
                <label>
                  {t("Repetir contraseña")}
                  <input
                    aria-label={t("Repetir contraseña")}
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={repeat}
                    disabled={busy}
                    onChange={(e) => setRepeat(e.target.value)}
                  />
                </label>
                <small>{t("Usa al menos 8 caracteres.")}</small>
              </>
            )}
            {error && (
              <div className="auth-feedback auth-error" role="alert">
                {t(error)}
              </div>
            )}
            {message && (
              <div className="auth-feedback" role="status">
                {t(message)}
              </div>
            )}
            <button
              className="primary auth-submit"
              disabled={busy}
              type="submit"
            >
              {t(
                busy
                  ? "Procesando…"
                  : mode === "signup"
                    ? "Crear cuenta"
                    : mode === "recover"
                      ? "Enviar enlace"
                      : "Iniciar sesión",
              )}
            </button>
            {mode === "signin" && (
              <button
                type="button"
                className="text-button"
                disabled={busy}
                onClick={() => change("recover")}
              >
                {t("Olvidé mi contraseña")}
              </button>
            )}
          </form>
          <div className="auth-divider">
            <span>{t("o")}</span>
          </div>
          <button className="google" onClick={onGoogle} disabled={busy}>
            <GoogleMark />
            {t("Continuar con Google")}
          </button>
        </>
      ) : (
        <>
          <button className="primary auth-submit" onClick={onDemo}>
            {t("Entrar en la demostración")}
          </button>
          <p className="muted">
            {t(
              "Google estará disponible al configurar Supabase. Esta demo no utiliza una cuenta real.",
            )}
          </p>
        </>
      )}
      <small className="auth-private">
        {t("Tu perfil es privado por defecto.")}
      </small>
    </div>
  );
}
