import { test, expect } from "@playwright/test";
test("one sort entry per criterion; selecting the active criterion reverses it", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Orden", exact: true });
  async function choose(criterion: string) {
    await trigger.click();
    await expect(page.getByRole("menuitem")).toHaveCount(3);
    const option = page.getByRole("menuitem", {
      name: new RegExp("^" + criterion.replace("%", "%")),
    });
    await expect(option).toHaveCount(1);
    await option.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  }
  const first = page
    .locator(".achievement-grid .achievement")
    .first()
    .getByRole("heading");
  await choose("Rareza");
  await expect(trigger).toHaveText("Rareza ▼");
  await expect(first).toHaveText("Vuelta al mundo");
  await choose("Rareza");
  await expect(trigger).toHaveText("Rareza ▲");
  await expect(first).toHaveText("Pantalla azul");
  await choose("Nombre");
  await expect(trigger).toHaveText("Nombre ▲");
  await choose("Nombre");
  await expect(trigger).toHaveText("Nombre ▼");
  await expect(first).toHaveText("Vuelta al mundo");
  await choose("Fecha");
  await expect(trigger).toHaveText("Más recientes ▼");
  await expect(first).toHaveText("Un amanecer distinto");
  await choose("Fecha");
  await expect(trigger).toHaveText("Menos recientes ▲");
  await expect(first).toHaveText("¡Rómpete una pierna!");
  await page.getByLabel("Idioma / Language").selectOption("en");
  const english = page.getByRole("button", { name: "Sort", exact: true });
  await english.click();
  await expect(page.getByRole("menuitem")).toHaveCount(3);
  for (const name of ["Rarity", "Name", "Date"])
    await expect(
      page.getByRole("menuitem", { name: new RegExp("^" + name) }),
    ).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(english).toHaveAttribute("aria-expanded", "false");
  await expect(english).toBeFocused();
});
