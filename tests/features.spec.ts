import { test, expect } from "@playwright/test";
test("editable profile, social requests, public showcase and follow links", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Ver tu perfil", exact: true })
    .click();
  await page.getByRole("button", { name: "Entrar en la demostración" }).click();
  await page
    .getByRole("button", { name: "Ver tu perfil", exact: true })
    .click();
  const avatar = await page.screenshot({
    clip: { x: 0, y: 0, width: 80, height: 80 },
  });
  const visibility = page.getByRole("switch", {
    name: "Perfil público",
    exact: true,
  });
  await expect(visibility).toHaveAttribute("aria-checked", "false");
  await visibility.click();
  await expect(visibility).toHaveAttribute("aria-checked", "true");
  await page.getByLabel("Nombre visible", { exact: true }).fill("Joseph");
  await page.getByLabel("Foto de perfil", { exact: true }).setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: avatar,
  });
  await page
    .getByRole("button", { name: "Guardar cambios", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("Cambios guardados.");
  await expect(page.locator(".profile-title img")).toHaveAttribute(
    "src",
    /^data:image\/webp/,
  );
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "Ver tu perfil", exact: true })
    .click();
  await page.getByRole("button", { name: "Entrar en la demostración" }).click();
  await page
    .getByRole("button", { name: "Ver tu perfil", exact: true })
    .click();
  await expect(page.getByLabel("Nombre visible", { exact: true })).toHaveValue(
    "Joseph",
  );
  await expect(
    page.getByRole("switch", { name: "Perfil público", exact: true }),
  ).toHaveAttribute("aria-checked", "true");
  await page
    .getByRole("switch", { name: "Perfil público", exact: true })
    .click();
  await expect(
    page.getByRole("switch", { name: "Perfil público", exact: true }),
  ).toHaveAttribute("aria-checked", "false");
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await page.getByRole("tab", { name: "COMUNIDAD", exact: true }).click();
  await expect(page.locator(".community-card")).toHaveCount(3);
  await page.screenshot({ path: "test-results/community.png", fullPage: true });
  const alex = page.locator(".community-card").filter({
    has: page.getByRole("heading", { name: "Alex · Demo", exact: true }),
  });
  await alex.getByRole("button", { name: "Ver perfil", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Perfil de jugador" }),
  ).toBeVisible();
  await expect(page.locator(".public-profile .achievement-mini")).toHaveCount(
    2,
  );
  const mini = page.locator(".public-profile .achievement-mini").first();
  await expect(mini.locator(".achievement-artwork")).toHaveText("✈️");
  await expect(mini).toHaveAttribute("data-rarity", "Común");
  await expect(mini.locator(".rarity")).toHaveText("Común");
  await mini.hover();
  const tooltip = page
    .getByRole("tooltip")
    .filter({ hasText: "Mi primer vuelo" });
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText("Has viajado en avión por primera vez.");
  await page.screenshot({
    path: "test-results/profile-showcase.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await alex.getByRole("button", { name: "Añadir amigo", exact: true }).click();
  await expect(alex.getByText("Solicitud enviada")).toBeVisible();
  await page.getByRole("button", { name: "Solicitudes", exact: true }).click();
  const luna = page.locator(".community-card").filter({
    has: page.getByRole("heading", { name: "Luna · Demo", exact: true }),
  });
  await luna.getByRole("button", { name: "Aceptar", exact: true }).click();
  await page.getByRole("button", { name: "Amigos", exact: true }).click();
  await expect(luna).toBeVisible();
  await luna
    .getByRole("button", { name: "Eliminar amigo", exact: true })
    .click();
  await expect(page.getByText("No hay jugadores para mostrar.")).toBeVisible();
  await page.getByRole("button", { name: "Seguir", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "GitHub", exact: true }),
  ).toHaveAttribute("href", "https://github.com/JosephDonoso/life-in-progress");
  await expect(
    page.getByRole("link", { name: "Apoyar en Ko-fi", exact: true }),
  ).toHaveAttribute("href", "https://ko-fi.com/jdevshowcase");
});
test("language preference, translated catalog search and rarity bands", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Idioma / Language").selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("tab", { name: "COMMUNITY", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search the catalog").fill("meteor");
  await expect(
    page.getByRole("heading", { name: "Under the stars", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search the catalog").fill("");
  await page.getByLabel("Rarity", { exact: true }).selectOption("Raro");
  await expect(page.locator(".achievement")).toHaveCount(10);
  await expect(page.locator(".achievement").first()).toHaveAttribute(
    "data-rarity",
    "Raro",
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByLabel("Idioma / Language").selectOption("es");
  await expect(
    page.getByRole("tab", { name: "COMUNIDAD", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Rareza", { exact: true }).locator("option"),
  ).toHaveCount(5);
  await expect(
    page.getByLabel("Rareza", { exact: true }).locator("option"),
  ).not.toContainText(["Súper raro"]);
});
test.describe("system language", () => {
  test.use({ locale: "en-US" });
  test("English system default", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      page.getByRole("tab", { name: "ACHIEVEMENTS", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: "test-results/english.png", fullPage: true });
  });
});
test.describe("unsupported system language", () => {
  test.use({ locale: "fr-FR" });
  test("falls back to Spanish", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
  });
});
