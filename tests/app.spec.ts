import { test, expect } from "@playwright/test";

test("all catalog pages display locally bundled achievement images", async ({
  page,
}) => {
  await page.goto("/");
  let checked = 0;
  for (let current = 0; current < 18; current++) {
    const cards = page.locator(".achievement-grid .achievement");
    await expect(cards).toHaveCount(current === 17 ? 2 : 12);
    const images = cards.locator(".achievement-artwork img");
    await expect(images).toHaveCount(current === 17 ? 2 : 12);
    const loaded = await images.evaluateAll(async (nodes) =>
      Promise.all(
        nodes.map(async (node) => {
          const img = node as HTMLImageElement;
          await img.decode();
          return (
            img.naturalWidth > 0 && img.src.includes("/images/achievements/")
          );
        }),
      ),
    );
    expect(loaded.every(Boolean)).toBe(true);
    checked += loaded.length;
    const next = page.getByRole("button", { name: "Siguiente", exact: true });
    if (current < 17) await next.click();
    else await expect(next).toBeDisabled();
  }
  expect(checked).toBe(206);
});

test("unavailable achievement images show a visible fallback", async ({
  page,
}) => {
  await page.route("**/images/achievements/*.svg", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator(".achievement-artwork .lucide-award")).toHaveCount(
    12,
  );
  await expect(page.locator(".achievement-artwork img")).toHaveCount(0);
});
test("demo: login, persistence, favorite, filters and removal", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("MODO DEMOSTRACIÓN")).toBeVisible();
  await page
    .getByRole("button", { name: "Desbloquear Día de pago", exact: true })
    .click();
  await page.getByRole("button", { name: "Entrar en la demostración" }).click();
  await page
    .getByRole("button", { name: "Desbloquear Día de pago", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Desmarcar Día de pago",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Destacar Día de pago", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Desmarcar Día de pago",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("Buscar en el catálogo").fill("estrella fugaz");
  await expect(page.locator(".achievement")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Pide un deseo", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Buscar en el catálogo").fill("ningún resultado aquí");
  await expect(
    page.getByText("No hay experiencias con estos filtros."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Limpiar filtros" }).click();
  await page.getByRole("button", { name: "Iniciar sesión" }).first().click();
  await page.getByRole("button", { name: "Entrar en la demostración" }).click();
  await page
    .getByRole("button", { name: "Desmarcar Día de pago", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Desbloquear Día de pago",
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
