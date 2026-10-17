import type { ReactNode } from "react";
import { useLanguage } from "../i18n/useLanguage";
export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const { t } = useLanguage();
  return (
    <section className={`side-panel ${className}`}>
      <div className="side-heading">
        <h3>{t(title)}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
