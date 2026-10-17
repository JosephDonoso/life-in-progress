import { useLanguage } from "../i18n/useLanguage";
import { Search } from "lucide-react";
export function SearchField({
  value,
  onChange,
  label,
  placeholder = "Buscar logros…",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
}) {
  const { t: tr } = useLanguage();

  return (
    <label className={`search-field ${className}`}>
      <Search size={17} />
      <input
        aria-label={tr(label)}
        placeholder={tr(placeholder)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
