import { createContext } from "react";
export type Preference = "system" | "es" | "en";
export const LanguageContext = createContext<{
  language: "es" | "en";
  preference: Preference;
  setPreference: (p: Preference) => void;
  t: (text: string | number) => string;
}>({
  language: "es",
  preference: "system",
  setPreference: () => {},
  t: (s) => String(s),
});
