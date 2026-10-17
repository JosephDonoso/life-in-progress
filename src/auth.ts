export function authReturnUrl() {
  return new URL(".", window.location.href).href;
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
      return "El enlace venció. Solicita uno nuevo.";
    default:
      return "No se pudo completar la operación. Inténtalo nuevamente.";
  }
}
