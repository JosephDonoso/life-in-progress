import { Mail } from "lucide-react";
import { useLanguage } from "../i18n/useLanguage";
export function SignInButton({
  onClick,
  primary = false,
}: {
  onClick: () => void;
  primary?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <button
      className={`google sign-in ${primary ? "google-primary" : ""}`}
      onClick={onClick}
    >
      <Mail size={22} />
      <span>{t("Iniciar sesión")}</span>
    </button>
  );
}
