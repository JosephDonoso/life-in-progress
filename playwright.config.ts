import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  use: { locale: "es-CL" },
  projects: [
    {
      name: "demo",
      testIgnore: "**/email-auth.spec.ts",
      use: { baseURL: "http://127.0.0.1:5174" },
    },
    {
      name: "email-auth",
      testMatch: "**/email-auth.spec.ts",
      use: { baseURL: "http://127.0.0.1:5175" },
    },
  ],
  webServer: [
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5174 --strictPort",
      url: "http://127.0.0.1:5174",
      env: { VITE_SUPABASE_URL: "", VITE_SUPABASE_PUBLISHABLE_KEY: "" },
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5175 --strictPort",
      url: "http://127.0.0.1:5175",
      env: {
        VITE_SUPABASE_URL: "https://auth-test.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      },
    },
  ],
});
