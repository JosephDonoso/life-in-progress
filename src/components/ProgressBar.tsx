import { useLanguage } from "../i18n/useLanguage";
export function ProgressBar({ value }: { value: number }) {
  const { t: tr } = useLanguage();

  return (
    <div
      className="track"
      role="progressbar"
      aria-label={tr("Progreso del catálogo")}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <i style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
