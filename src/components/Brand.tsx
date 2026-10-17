import { useLanguage } from "../i18n/useLanguage";
import { Gamepad2 } from "lucide-react";
export function Brand({ hero = false }: { hero?: boolean }) {
  const { t: tr } = useLanguage();

  return (
    <span className={`brand ${hero ? "brand-hero" : ""}`}>
      <span className="brand-icon">
        <Gamepad2 />
      </span>
      <span>
        {tr("LIFE ")}
        <b>{tr("IN PROGRESS")}</b>
      </span>
    </span>
  );
}
