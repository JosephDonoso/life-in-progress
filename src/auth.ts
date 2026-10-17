export function authReturnUrl() {
  return new URL(".", window.location.href).href;
}

// Read only intent/error flags, before Supabase consumes and clears URL tokens.
export function captureAuthCallback() {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const query = new URLSearchParams(window.location.search);
  return {
    recovery: (hash.get("type") || query.get("type")) === "recovery",
    errorCode:
      hash.get("error_code") ||
      query.get("error_code") ||
      (hash.has("error") || query.has("error") ? "invalid_callback" : null),
  };
}

const recoveryKey = "lip-password-recovery";
type Recovery = { userId: string; expires: number };
let recovery: Recovery | null = null;
export function rememberPasswordRecovery(userId: string) {
  recovery = { userId, expires: Date.now() + 15 * 60_000 };
  try {
    sessionStorage.setItem(recoveryKey, JSON.stringify(recovery));
  } catch {
    /* Memory fallback for restricted storage. */
  }
}
export function clearPasswordRecovery() {
  recovery = null;
  try {
    sessionStorage.removeItem(recoveryKey);
  } catch {
    /* Storage may be restricted. */
  }
}
export function hasPasswordRecovery(userId: string) {
  try {
    const saved: unknown = JSON.parse(
      sessionStorage.getItem(recoveryKey) || "null",
    );
    if (
      saved &&
      typeof saved === "object" &&
      "userId" in saved &&
      "expires" in saved &&
      typeof saved.userId === "string" &&
      typeof saved.expires === "number"
    )
      recovery = saved as Recovery;
  } catch {
    /* Use the in-memory intent if storage is unavailable. */
  }
  if (recovery?.userId === userId && recovery.expires > Date.now()) return true;
  clearPasswordRecovery();
  return false;
}
export function authErrorMessage(error: { code?: string; message?: string }) {
  switch (error.code) {
    case "invalid_credentials":
      return "El correo o la contraseña no son correctos.";
    case "email_not_confirmed":
      return "Confirma tu correo antes de iniciar sesión.";
    case "email_address_not_authorized":
      return "Supabase no permite enviar correos a esta dirección. Para probar, usa el correo de tu cuenta de Supabase o configura SMTP.";
    case "same_password":
      return "Elige una contraseña distinta de la anterior.";
    case "validation_failed":
    case "email_address_invalid":
      return "Revisa el correo y los datos ingresados.";
    case "user_already_exists":
    case "email_exists":
      return "No se pudo crear la cuenta. Si ya tienes una, inicia sesión o recupera tu contraseña.";
    case "weak_password":
      return "Elige una contraseña más segura, de al menos 8 caracteres.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.";
    case "signup_disabled":
    case "email_provider_disabled":
      return "El acceso por correo debe habilitarse en Supabase.";
    case "otp_expired":
    case "flow_state_expired":
    case "invalid_callback":
      return "El enlace venció. Solicita uno nuevo.";
    default:
      return "No se pudo completar la operación. Inténtalo nuevamente.";
  }
}
