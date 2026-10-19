import { createClient } from "@supabase/supabase-js";
import type { Achievement } from "./data";
import { demo } from "./data";
import { captureAuthCallback } from "./auth";
export const authCallback = captureAuthCallback();
const url = import.meta.env.VITE_SUPABASE_URL,
  key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const db = url && key ? createClient(url, key) : null;
export type Progress = {
  unlocked: string[];
  featured: string[];
  public: boolean;
};
export type PlayerState = Progress & {
  distribution: Record<string, number>;
  categories: { name: string; total: number; unlocked: number }[];
  rarest: { name: string; percentage: number } | null;
  featured_names: Record<string, string>;
  featured_details: Achievement[];
};
export const empty: Progress = { unlocked: [], featured: [], public: false };
export function localProgress(): Progress {
  try {
    const saved = JSON.parse(localStorage.getItem("lip-progress") || "{}");
    const activeIds = new Set(demo.map((a) => a.id));
    const unlocked = Array.isArray(saved.unlocked)
      ? saved.unlocked.filter((id: string) => activeIds.has(id))
      : [];
    return {
      unlocked,
      featured: Array.isArray(saved.featured)
        ? saved.featured.filter((id: string) => unlocked.includes(id))
        : [],
      public: saved.public === true,
    };
  } catch {
    return empty;
  }
}
