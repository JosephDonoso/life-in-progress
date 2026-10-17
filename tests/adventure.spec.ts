import { test, expect } from "@playwright/test";
test("My adventure: global proportions, descending order, own achievements and responsive list", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Entrar en la demostración", exact: true })
    .click();
  await page.getByRole("button", { name: "Mi aventura", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Mi aventura", exact: true });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("tab", { name: "Logros globales", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  const rows = dialog.locator(".adventure-row");
  await expect(rows).toHaveCount(12);
  const percentages = await rows.evaluateAll((nodes) =>
    nodes.map((n) => Number(n.getAttribute("data-percentage"))),
  );
  expect(percentages).toEqual([...percentages].sort((a, b) => b - a));
  expect(percentages[0]).toBe(89);
  const originalIds = await rows.evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute("aria-label")),
  );
  await dialog.getByRole("button", { name: "Ver más", exact: true }).click();
  await expect(rows).toHaveCount(24);
  await expect(
    dialog.getByRole("button", { name: "Ver más", exact: true }),
  ).toHaveCount(0);
  const expandedIds = await rows.evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute("aria-label")),
  );
  expect(expandedIds.slice(0, 12)).toEqual(originalIds);
  expect(new Set(expandedIds).size).toBe(24);
  const expandedPercentages = await rows.evaluateAll((nodes) =>
    nodes.map((n) => Number(n.getAttribute("data-percentage"))),
  );
  expect(expandedPercentages).toEqual(
    [...expandedPercentages].sort((a, b) => b - a),
  );
  const bone = dialog.getByRole("button", {
    name: "Desbloquear Mi primer vuelo",
    exact: true,
  });
  await expect(bone).toHaveAttribute("aria-pressed", "false");
  const proportion = await bone.evaluate((el) => {
    const fill = el.querySelector(".adventure-proportion")!;
    return (
      (fill.getBoundingClientRect().width / el.getBoundingClientRect().width) *
      100
    );
  });
  expect(proportion).toBeCloseTo(62.1, 0);
  await bone.click();
  const unlocked = dialog.getByRole("button", {
    name: "Desmarcar Mi primer vuelo",
    exact: true,
  });
  await expect(unlocked).toHaveAttribute("aria-pressed", "true");
  await expect(unlocked).toHaveClass(/unlocked/);
  await dialog.getByRole("tab", { name: "Mis logros", exact: true }).click();
  await expect(rows).toHaveCount(1);
  await expect(
    dialog.getByRole("button", { name: "Ver más", exact: true }),
  ).toHaveCount(0);
  await expect(unlocked).toBeVisible();
  await dialog
    .getByRole("tab", { name: "Logros globales", exact: true })
    .click();
  await dialog
    .getByLabel("Buscar en mi aventura", { exact: true })
    .fill("vuelo");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("Mi primer vuelo");
  await dialog.getByLabel("Buscar en mi aventura", { exact: true }).fill("");
  await expect(rows).toHaveCount(12);
  await dialog.screenshot({ path: "test-results/adventure-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await dialog.screenshot({ path: "test-results/adventure-mobile.png" });
  await dialog.getByRole("button", { name: "Cerrar", exact: true }).click();
  await expect(dialog).not.toBeVisible();
});
