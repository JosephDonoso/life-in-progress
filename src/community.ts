import { db } from "./service";
import { demo } from "./data";
import type { Achievement } from "./data";
export type Relationship = "none" | "incoming" | "outgoing" | "friends";
export type CommunityPlayer = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  unlocked: number | null;
  is_public: boolean;
  relationship: Relationship;
};
export type PublicProfile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  unlocked: number;
  featured: Achievement[];
};
export type FriendAction =
  "request" | "accept" | "decline" | "cancel" | "remove";
const samples: CommunityPlayer[] = [
  {
    id: "demo-alex",
    display_name: "Alex · Demo",
    avatar_url: null,
    unlocked: 12,
    is_public: true,
    relationship: "none",
  },
  {
    id: "demo-sam",
    display_name: "Sam · Demo",
    avatar_url: null,
    unlocked: 8,
    is_public: true,
    relationship: "none",
  },
  {
    id: "demo-luna",
    display_name: "Luna · Demo",
    avatar_url: null,
    unlocked: 16,
    is_public: true,
    relationship: "none",
  },
];
function relations(): Record<string, Relationship> {
  try {
    return JSON.parse(
      localStorage.getItem("lip-friends") || '{"demo-luna":"incoming"}',
    );
  } catch {
    return {};
  }
}
export async function listCommunity(
  search: string,
  filter: string,
  page: number,
  authenticated: boolean,
  signal?: AbortSignal,
) {
  if (db) {
    const request = db.rpc("community_profiles", {
      search_text: search,
      list_filter: filter,
      page_number: page,
    });
    const { data, error } = await (signal
      ? request.abortSignal(signal)
      : request);
    if (error) throw error;
    return data as { items: CommunityPlayer[]; total: number };
  }
  const saved = relations();
  const players = samples
    .map((p) => ({
      ...p,
      relationship: authenticated
        ? saved[p.id] || "none"
        : ("none" as Relationship),
    }))
    .filter(
      (p) =>
        p.display_name.toLowerCase().includes(search.toLowerCase()) &&
        (filter === "all" ||
          (filter === "friends"
            ? p.relationship === "friends"
            : ["incoming", "outgoing"].includes(p.relationship))),
    );
  return {
    items: players.slice(page * 12, page * 12 + 12),
    total: players.length,
  };
}
export async function changeFriendship(target: string, action: FriendAction) {
  if (db) {
    const { error } = await db.rpc("friendship_action", {
      target_id: target,
      action_name: action,
    });
    if (error) throw error;
    return;
  }
  const saved = relations();
  if (action === "request") saved[target] = "outgoing";
  else if (action === "accept") saved[target] = "friends";
  else delete saved[target];
  localStorage.setItem("lip-friends", JSON.stringify(saved));
}
export async function getPublicProfile(
  id: string,
): Promise<PublicProfile | null> {
  if (db) {
    const { data, error } = await db.rpc("public_profile", { target_id: id });
    if (error) throw error;
    return data;
  }
  const p = samples.find((p) => p.id === id);
  return p
    ? {
        ...p,
        unlocked: p.unlocked || 0,
        created_at: "2026-10-01T00:00:00Z",
        featured: ["demo-19", "demo-4"].flatMap((key) =>
          demo.filter((a) => a.id === key),
        ),
      }
    : null;
}
