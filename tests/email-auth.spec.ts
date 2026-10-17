import { test, expect, type Page } from "@playwright/test";

// Isolated Auth and PostgREST responses: never create accounts or send real emails.
async function mockSupabase(page: Page) {
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
        json = { items: [achievement], total: 1 };
        break;
      case "/rest/v1/rpc/global_stats":
        json = { achievements: 1, players: 2, unlocks: state.unlocked.length };
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
      case "/rest/v1/rpc/edit_profile":
        displayName = body.new_name;
        break;
      case "/rest/v1/user_achievements":
        state.unlocked = request.method() === "DELETE" ? [] : [achievement.id];
        break;
      default:
        throw new Error(`Unexpected Supabase request: ${url.pathname}`);
    }
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
});
