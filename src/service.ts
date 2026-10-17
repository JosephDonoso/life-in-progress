import { createClient } from "@supabase/supabase-js";
import type { Achievement } from "./data";
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
    return {
      ...empty,
      ...JSON.parse(localStorage.getItem("lip-progress") || "{}"),
    };
  } catch {
    return empty;
  }
}
