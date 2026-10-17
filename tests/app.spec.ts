import { test, expect } from "@playwright/test";
test("demo: login, persistence, favorite, filters and removal", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("MODO DEMOSTRACIÓN")).toBeVisible();
  await page
    .getByRole("button", { name: "Desbloquear Mi primer vuelo", exact: true })
    .click();
  await page.getByRole("button", { name: "Entrar en la demostración" }).click();
  await page
    .getByRole("button", { name: "Desbloquear Mi primer vuelo", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Desmarcar Mi primer vuelo",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Destacar Mi primer vuelo", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Desmarcar Mi primer vuelo",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("Buscar en el catálogo").fill("meteor");
  await expect(page.locator(".achievement")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Bajo las estrellas", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Buscar en el catálogo").fill("ningún resultado aquí");
  await expect(
    page.getByText("No hay experiencias con estos filtros."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Limpiar filtros" }).click();
  await page.getByRole("button", { name: "Iniciar sesión" }).first().click();
  await page.getByRole("button", { name: "Entrar en la demostración" }).click();
  await page
    .getByRole("button", { name: "Desmarcar Mi primer vuelo", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Desbloquear Mi primer vuelo",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "false");
});
test("mobile layout and gallery", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Vive a tu manera", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Vive a tu manera", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
});
test("desktop reference layout", async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 1024 });
  await page.goto("/");
  await expect(page.locator(".achievement")).toHaveCount(12);
  await page.evaluate(() => document.fonts.ready);
  const header = await page.locator(".site-header").boundingBox();
  const hero = await page.locator(".hero").boundingBox();
  const gallery = await page.locator(".showcase").boundingBox();
  const search = await page.locator(".header-search").boundingBox();
  const login = await page.locator(".header-inner > .google").boundingBox();
  expect(header?.height).toBe(66);
  expect(hero?.y).toBe(160);
  expect(hero?.height).toBe(246);
  expect(gallery?.height).toBe(347);
  expect(search?.height).toBe(login?.height);
  expect(
    await page
      .locator(".achievement-grid")
      .evaluate(
        (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
      ),
  ).toBe(3);
  await page
    .getByRole("button", { name: "Imagen anterior", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Alcanza tu próxima cima", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Imagen siguiente", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Explora lo extraordinario",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .locator(".thumbnails img")
    .first()
    .evaluate((img: HTMLImageElement) => img.decode());
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
});
