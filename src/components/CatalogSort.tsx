import { useEffect, useRef, useState } from "react";
import { catalogSortCriteria, catalogSortOptions } from "../sorting";
import { useLanguage } from "../i18n/useLanguage";
export function CatalogSort({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useLanguage(),
    [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  const selected =
    catalogSortOptions.find((o) => o.value === value) || catalogSortOptions[0];
  useEffect(() => {
    if (!open) return;
    root.current
      ?.querySelector<HTMLButtonElement>(
        '[role="menuitem"][data-active="true"]',
      )
      ?.focus();
    function outside(e: PointerEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    }
    function escape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <div
      className="catalog-sort"
      ref={root}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        className="catalog-sort-trigger"
        aria-label={t("Orden")}
        aria-haspopup="menu"
        aria-expanded={open}
        title={t(selected.description)}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {t(selected.label)} <span aria-hidden="true">{selected.triangle}</span>
      </button>
      {open && (
        <div
          className="catalog-sort-menu"
          role="menu"
          aria-label={t("Orden")}
          onKeyDown={(e) => {
            const nodes = Array.from(
              e.currentTarget.querySelectorAll<HTMLButtonElement>(
                '[role="menuitem"]',
              ),
            );
            const current = nodes.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            let next = current;
            if (e.key === "ArrowDown") next = (current + 1) % nodes.length;
            else if (e.key === "ArrowUp")
              next = (current - 1 + nodes.length) % nodes.length;
            else if (e.key === "Home") next = 0;
            else if (e.key === "End") next = nodes.length - 1;
            else return;
            e.preventDefault();
            nodes[next]?.focus();
          }}
        >
          {catalogSortCriteria.map((c) => {
            const active = c.values.includes(value);
            return (
              <button
                key={c.key}
                type="button"
                role="menuitem"
                data-active={active}
                onClick={() => {
                  onChange(
                    active ? c.values.find((v) => v !== value)! : c.values[0],
                  );
                  setOpen(false);
                  trigger.current?.focus();
                }}
              >
                <span>{t(c.label)}</span>
                {active && <span aria-hidden="true">{selected.triangle}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
