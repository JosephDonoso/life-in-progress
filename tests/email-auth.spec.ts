import { test, expect, type Page } from "@playwright/test";

// Isolated Auth and PostgREST responses: never create accounts or send real emails.
async function mockSupabase(
  page: Page,
  options: {
    catalogSize?: number;
    heldSearches?: Map<string, Promise<void>>;
  } = {},
) {
  const user = {
    id: "11111111-1111-4111-8111-111111111111",
    email: "player@example.test",
    aud: "authenticated",
    role: "authenticated",
    created_at: "2026-10-16T12:00:00Z",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { full_name: "Exploradora" },
  };
  const token = [
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
      "base64url",
    ),
    Buffer.from(
      JSON.stringify({
        sub: user.id,
        exp: Math.floor(Date.now() / 1000) + 3600,
        aud: "authenticated",
        role: "authenticated",
      }),
    ).toString("base64url"),
    "test-signature",
  ].join(".");
  const session = {
    access_token: token,
    refresh_token: "test-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    user,
  };
  const achievement = {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Mi primer vuelo",
    description: "Has viajado en avión por primera vez.",
    icon: "✈️",
    category: "Viajes y exploración",
    percentage: 50,
    created_at: "2026-10-16T12:00:00Z",
  };
  const achievements = Array.from(
    { length: options.catalogSize || 1 },
    (_, i) =>
      i === 0
        ? achievement
        : {
            ...achievement,
            id: `33333333-3333-4333-8333-${String(i).padStart(12, "0")}`,
            name: `Experiencia ${i}`,
          },
  );
  const state = {
    unlocked: [] as string[],
    featured: [] as string[],
    public: false,
    distribution: {},
    categories: [],
    rarest: null,
    featured_names: {},
    featured_details: [],
  };
  let displayName = "Exploradora";
  const requests: { path: string; body: Record<string, unknown> }[] = [];
  await page.route("https://auth-test.supabase.co/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      body = request.postDataJSON() || {};
    if (request.method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "*",
          "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
        },
      });
      return;
    }
    requests.push({ path: url.pathname, body });
    let json: unknown = {};
    let status = 200;
    switch (url.pathname) {
      case "/auth/v1/signup":
        json = { user };
        break;
      case "/auth/v1/token":
        if (body.password === "wrong-password") {
          status = 400;
          json = {
            code: 400,
            error_code: "invalid_credentials",
            msg: "Invalid login credentials",
          };
        } else json = session;
        break;
      case "/auth/v1/user":
        json = user;
        break;
      case "/auth/v1/recover":
        break;
      case "/auth/v1/logout":
        break;
      case "/rest/v1/rpc/catalog_page":
        await options.heldSearches?.get(String(body.search_text));
        json = {
          items: achievements.slice(
            Number(body.page_number) * 12,
            Number(body.page_number) * 12 + 12,
          ),
          total: achievements.length,
        };
        break;
      case "/rest/v1/rpc/global_stats":
        json = {
          achievements: achievements.length,
          players: 2,
          unlocks: state.unlocked.length,
        };
        break;
      case "/rest/v1/categories":
        json = [{ name: achievement.category }];
        break;
      case "/rest/v1/profiles":
        json = { display_name: displayName, avatar_url: null };
        break;
      case "/rest/v1/rpc/player_state":
        json = state;
        break;
      case "/rest/v1/rpc/community_profiles":
        json = { items: [], total: 0 };
        break;
      case "/rest/v1/rpc/edit_profile":
        displayName = body.new_name;
        break;
      case "/rest/v1/rpc/update_profile":
        state.featured = body.favorites;
        state.public = body.public_profile;
        break;
      case "/rest/v1/user_achievements":
        state.unlocked = request.method() === "DELETE" ? [] : [achievement.id];
        break;
      default:
        throw new Error(`Unexpected Supabase request: ${url.pathname}`);
    }
    if (request.failure()) return;
    await route.fulfill({
      status,
      json,
      headers: { "access-control-allow-origin": "*" },
    });
  });
  return { requests, session, state };
}

async function openAuth(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .first()
    .click();
  return page.getByRole("dialog", { name: "Iniciar sesión", exact: true });
}

test("registration validates passwords and waits for email confirmation", async ({
  page,
}) => {
  const mock = await mockSupabase(page),
    dialog = await openAuth(page);
  await dialog.getByRole("tab", { name: "Crear cuenta", exact: true }).click();
  await dialog
    .getByLabel("Nombre visible", { exact: true })
    .fill("Exploradora");
  await dialog
    .getByLabel("Correo electrónico", { exact: true })
    .fill("player@example.test");
  await dialog
    .getByLabel("Contraseña", { exact: true })
    .fill("example-password");
  await dialog
    .getByLabel("Repetir contraseña", { exact: true })
    .fill("other-password");
  await dialog
    .getByRole("button", { name: "Crear cuenta", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toHaveText(
    "Las contraseñas no coinciden.",
  );
  expect(
    mock.requests.filter((r) => r.path === "/auth/v1/signup"),
  ).toHaveLength(0);
  await dialog
    .getByLabel("Repetir contraseña", { exact: true })
    .fill("example-password");
  await dialog
    .getByRole("button", { name: "Crear cuenta", exact: true })
    .click();
  await expect(dialog.getByRole("status")).toContainText("Revisa tu correo");
  expect(
    mock.requests.find((r) => r.path === "/auth/v1/signup")?.body,
  ).toMatchObject({
    email: "player@example.test",
    data: { full_name: "Exploradora" },
  });
  await expect(page.locator(".header-inner .account")).toHaveCount(0);
});

test("email login saves achievement and profile through Supabase and restores session", async ({
  page,
}) => {
  const mock = await mockSupabase(page),
    dialog = await openAuth(page);
  await dialog
    .getByLabel("Correo electrónico", { exact: true })
    .fill("player@example.test");
  await dialog.getByLabel("Contraseña", { exact: true }).fill("wrong-password");
  await dialog
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toHaveText(
    "El correo o la contraseña no son correctos.",
  );
  await dialog
    .getByLabel("Contraseña", { exact: true })
    .fill("example-password");
  await dialog
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator(".header-inner .account")).toContainText(
    "Exploradora",
  );
  await page
    .getByRole("button", { name: "Desbloquear Mi primer vuelo", exact: true })
    .click();
  await expect.poll(() => mock.state.unlocked.length).toBe(1);
  await page
    .getByRole("button", { name: "Ver tu perfil", exact: true })
    .click();
  const profile = page.getByRole("dialog", { name: "Mi perfil", exact: true });
  await profile
    .getByLabel("Nombre visible", { exact: true })
    .fill("Nombre guardado");
  await profile
    .getByRole("button", { name: "Guardar cambios", exact: true })
    .click();
  await expect(profile.getByRole("status")).toHaveText("Cambios guardados.");
  await page.reload();
  await expect(page.locator(".header-inner .account")).toContainText("Nombre");
  await expect(
    page.getByRole("button", {
      name: "Desmarcar Mi primer vuelo",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    "example-password",
  );
  await page
    .getByRole("button", { name: "Ver tu perfil", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Cerrar sesión", exact: true })
    .click();
  await expect(page.locator(".header-inner .account")).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Desbloquear Mi primer vuelo",
      exact: true,
    }),
  ).toBeVisible();
});

test("password recovery sends the app return URL", async ({ page }) => {
  const mock = await mockSupabase(page),
    dialog = await openAuth(page);
  await dialog
    .getByRole("button", { name: "Olvidé mi contraseña", exact: true })
    .click();
  await dialog
    .getByLabel("Correo electrónico", { exact: true })
    .fill("player@example.test");
  await dialog
    .getByRole("button", { name: "Enviar enlace", exact: true })
    .click();
  await expect(dialog.getByRole("status")).toContainText(
    "Si existe una cuenta",
  );
  expect(
    mock.requests.find((r) => r.path === "/auth/v1/recover")?.body,
  ).toMatchObject({ email: "player@example.test" });
});

test("a recovery callback opens password update and validates matching passwords", async ({
  page,
}) => {
  const mock = await mockSupabase(page);
  await page.goto(
    `/#access_token=${mock.session.access_token}&refresh_token=${mock.session.refresh_token}&token_type=bearer&expires_in=3600&type=recovery`,
  );
  const dialog = page.getByRole("dialog", {
    name: "Nueva contraseña",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await dialog
    .getByLabel("Nueva contraseña", { exact: true })
    .fill("new-example-password");
  await dialog
    .getByLabel("Repetir contraseña", { exact: true })
    .fill("other-password");
  await dialog
    .getByRole("button", { name: "Guardar contraseña", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toHaveText(
    "Las contraseñas no coinciden.",
  );
  await dialog
    .getByLabel("Repetir contraseña", { exact: true })
    .fill("new-example-password");
  await dialog
    .getByRole("button", { name: "Guardar contraseña", exact: true })
    .click();
  await expect(dialog.getByRole("status")).toContainText(
    "Contraseña actualizada.",
  );
  expect(
    mock.requests.some(
      (r) =>
        r.path === "/auth/v1/user" &&
        r.body.password === "new-example-password",
    ),
  ).toBe(true);
  await page.reload();
  await expect(page.locator(".header-inner .account")).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "Nueva contraseña", exact: true }),
  ).toHaveCount(0);
});

test("searches debounce typing and reuse metadata across filtering, pagination and views", async ({
  page,
}) => {
  const mock = await mockSupabase(page, { catalogSize: 24 });
  const count = (path: string) =>
    mock.requests.filter((r) => r.path === `/rest/v1/${path}`).length;
  await page.clock.install();
  await page.goto("/");
  await expect(page.locator(".achievement")).toHaveCount(12);
  await expect.poll(() => count("rpc/global_stats")).toBe(1);
  await expect.poll(() => count("categories")).toBe(1);
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  const initial = count("rpc/catalog_page");
  const search = page.getByLabel("Buscar en el catálogo", { exact: true });
  await search.fill("v");
  await page.clock.runFor(100);
  await search.fill("vu");
  await page.clock.runFor(100);
  await search.fill("vuelo");
  await page.clock.runFor(299);
  expect(count("rpc/catalog_page")).toBe(initial);
  await page.clock.runFor(1);
  await expect.poll(() => count("rpc/catalog_page")).toBe(initial + 1);
  expect(
    mock.requests.filter((r) => r.path === "/rest/v1/rpc/catalog_page").at(-1)
      ?.body.search_text,
  ).toBe("vuelo");
  await expect(page.locator(".achievement")).toHaveCount(12);
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await expect.poll(() => count("rpc/catalog_page")).toBe(initial + 2);
  expect(
    mock.requests.filter((r) => r.path === "/rest/v1/rpc/catalog_page").at(-1)
      ?.body.page_number,
  ).toBe(1);
  await expect(page.locator(".achievement")).toHaveCount(12);
  await page
    .getByLabel("Categoría", { exact: true })
    .selectOption("Viajes y exploración");
  await expect.poll(() => count("rpc/catalog_page")).toBe(initial + 3);
  expect(
    mock.requests.filter((r) => r.path === "/rest/v1/rpc/catalog_page").at(-1)
      ?.body.page_number,
  ).toBe(0);
  expect(count("rpc/global_stats")).toBe(1);
  expect(count("categories")).toBe(1);
  await page.getByRole("tab", { name: "COMUNIDAD", exact: true }).click();
  await expect.poll(() => count("rpc/community_profiles")).toBeGreaterThan(0);
  const community = count("rpc/community_profiles");
  const players = page.getByLabel("Buscar jugadores", { exact: true });
  await players.fill("A");
  await page.clock.runFor(100);
  await players.fill("Alex");
  await page.clock.runFor(299);
  expect(count("rpc/community_profiles")).toBe(community);
  await page.clock.runFor(1);
  await expect.poll(() => count("rpc/community_profiles")).toBe(community + 1);
  await page.clock.runFor(30_001);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect.poll(() => count("rpc/global_stats")).toBe(2);
  expect(count("categories")).toBe(1);
});

test("obsolete searches are aborted as soon as the input changes", async ({
  page,
}) => {
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const mock = await mockSupabase(page, {
    heldSearches: new Map([["lenta", held]]),
  });
  let aborted = false;
  page.on("requestfailed", (request) => {
    if (
      request.url().includes("/rpc/catalog_page") &&
      request.postDataJSON()?.search_text === "lenta"
    )
      aborted = true;
  });
  await page.clock.install();
  await page.goto("/");
  await expect(page.locator(".achievement")).toHaveCount(1);
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  const search = page.getByLabel("Buscar en el catálogo", { exact: true });
  await search.fill("lenta");
  await page.clock.runFor(300);
  await expect
    .poll(() => mock.requests.some((r) => r.body.search_text === "lenta"))
    .toBe(true);
  await search.fill("nueva");
  await expect.poll(() => aborted).toBe(true);
  expect(mock.requests.some((r) => r.body.search_text === "nueva")).toBe(false);
  release();
  await page.clock.runFor(300);
  await expect
    .poll(() => mock.requests.some((r) => r.body.search_text === "nueva"))
    .toBe(true);
  await expect(page.locator(".achievement")).toHaveCount(1);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("saving an achievement refreshes progress once and shares metadata with My adventure", async ({
  page,
}) => {
  const mock = await mockSupabase(page);
  const count = (path: string) =>
    mock.requests.filter((r) => r.path === `/rest/v1/${path}`).length;
  const dialog = await openAuth(page);
  await dialog
    .getByLabel("Correo electrónico", { exact: true })
    .fill("player@example.test");
  await dialog
    .getByLabel("Contraseña", { exact: true })
    .fill("example-password");
  await dialog
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await expect(page.locator(".header-inner .account")).toBeVisible();
  const unlock = page.getByRole("button", {
    name: "Desbloquear Mi primer vuelo",
    exact: true,
  });
  await expect(unlock).toBeEnabled();
  await expect.poll(() => count("rpc/global_stats")).toBe(2);
  const before = {
    profile: count("profiles"),
    state: count("rpc/player_state"),
    catalog: count("rpc/catalog_page"),
    stats: count("rpc/global_stats"),
    categories: count("categories"),
  };
  await unlock.click();
  const completed = page.getByRole("button", {
    name: "Desmarcar Mi primer vuelo",
    exact: true,
  });
  await expect(completed).toBeEnabled();
  await expect.poll(() => count("rpc/global_stats")).toBe(before.stats + 1);
  await expect.poll(() => count("rpc/catalog_page")).toBe(before.catalog + 1);
  expect(count("profiles")).toBe(before.profile);
  expect(count("rpc/player_state")).toBe(before.state + 1);
  expect(count("categories")).toBe(before.categories);
  const favorite = page.getByRole("button", {
    name: "Destacar Mi primer vuelo",
    exact: true,
  });
  await favorite.click();
  await expect(favorite).toBeEnabled();
  await expect(favorite).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => count("rpc/player_state")).toBe(before.state + 2);
  expect(count("profiles")).toBe(before.profile);
  expect(count("rpc/catalog_page")).toBe(before.catalog + 1);
  expect(count("rpc/global_stats")).toBe(before.stats + 1);
  await page.getByRole("button", { name: "Mi aventura", exact: true }).click();
  const adventure = page.getByRole("dialog", {
    name: "Mi aventura",
    exact: true,
  });
  await expect(adventure.locator(".adventure-row")).toHaveCount(1);
  expect(count("rpc/global_stats")).toBe(before.stats + 1);
  expect(count("categories")).toBe(before.categories);
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  const initial = count("rpc/catalog_page");
  await adventure
    .getByLabel("Buscar en mi aventura", { exact: true })
    .fill("vue");
  await page.clock.runFor(100);
  await adventure
    .getByLabel("Buscar en mi aventura", { exact: true })
    .fill("vuelo");
  await page.clock.runFor(299);
  expect(count("rpc/catalog_page")).toBe(initial);
  await page.clock.runFor(1);
  await expect.poll(() => count("rpc/catalog_page")).toBe(initial + 1);
});

test("recovery still opens if Supabase finishes before React mounts", async ({
  page,
}) => {
  const mock = await mockSupabase(page);
  await page.route("**/src/main.tsx", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body:
        "await new Promise(resolve => setTimeout(resolve, 250));\n" +
        (await response.text()),
    });
  });
  await page.goto(
    `/#access_token=${mock.session.access_token}&refresh_token=${mock.session.refresh_token}&token_type=bearer&expires_in=3600&type=recovery`,
  );
  await expect(
    page.getByRole("dialog", { name: "Nueva contraseña", exact: true }),
  ).toBeVisible({ timeout: 3000 });
  await page.reload();
  const dialog = page.getByRole("dialog", {
    name: "Nueva contraseña",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cerrar", exact: true }).click();
  await page.reload();
  await expect(page.locator(".header-inner .account")).toBeVisible();
  await expect(dialog).toHaveCount(0);
});

test("expired recovery links report the error instead of reopening a stored recovery form", async ({
  page,
}) => {
  const mock = await mockSupabase(page);
  await page.goto(
    `/#access_token=${mock.session.access_token}&refresh_token=${mock.session.refresh_token}&token_type=bearer&expires_in=3600&type=recovery`,
  );
  await expect(
    page.getByRole("dialog", { name: "Nueva contraseña", exact: true }),
  ).toBeVisible();
  // An external email link loads a new document, not an in-page hash change.
  await page.goto("about:blank");
  await page.goto(
    "/#error=access_denied&error_code=otp_expired&error_description=Expired",
  );
  await expect(page.getByRole("alert")).toContainText(
    "El enlace venció. Solicita uno nuevo.",
  );
  await expect(
    page.getByRole("dialog", { name: "Nueva contraseña", exact: true }),
  ).toHaveCount(0);
  await page.goto("/");
  await expect(page.locator(".header-inner .account")).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "Nueva contraseña", exact: true }),
  ).toHaveCount(0);
});

test("signup confirmations do not open password recovery", async ({ page }) => {
  const mock = await mockSupabase(page);
  await page.goto(
    `/#access_token=${mock.session.access_token}&refresh_token=${mock.session.refresh_token}&token_type=bearer&expires_in=3600&type=signup`,
  );
  await expect(page.locator(".header-inner .account")).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "Nueva contraseña", exact: true }),
  ).toHaveCount(0);
});
