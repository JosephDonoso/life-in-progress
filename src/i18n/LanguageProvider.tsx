import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { english } from "./english";
import { LanguageContext as Context } from "./context";
import type { Preference } from "./context";
function detect(): "es" | "en" {
  return navigator.language?.toLowerCase().startsWith("en") ? "en" : "es";
}
function read(): Preference {
  try {
    const v = localStorage.getItem("lip-language");
    return v === "en" || v === "es" ? v : "system";
  } catch {
    return "system";
  }
}
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<Preference>(read),
    [system, setSystem] = useState(detect);
  const language = preference === "system" ? system : preference;
  useEffect(() => {
    const change = () => setSystem(detect());
    window.addEventListener("languagechange", change);
    return () => window.removeEventListener("languagechange", change);
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem("lip-language", preference);
    } catch {
      /* Device storage may be unavailable. */
    }
  }, [language, preference]);
  const t = useCallback(
    (input: string | number) => {
      const text = String(input);
      if (language === "es") return text;
      const key = text.replace(/\s+/g, " ").trim();
      const value = english[key];
      return value ? text.replace(key, value) : text;
    },
    [language],
  );
  return (
    <Context.Provider value={{ language, preference, setPreference, t }}>
      {children}
    </Context.Provider>
  );
}
