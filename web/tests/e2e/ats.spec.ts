import { test, expect } from "@playwright/test";

/**
 * Panneau Score ATS (Phase 5). L'analyse locale est purement client (aucun mock).
 * L'analyse IA passe par `/api/ats-score`, ici mocké via `page.route`.
 */

test("l'ATS affiche un score local puis un score IA", async ({ page }) => {
  await page.route("**/api/ats-score", async (route) => {
    await route.fulfill({
      json: {
        score: 82,
        matched_skills: ["react", "typescript"],
        missing_hard_skills: ["kubernetes"],
        missing_nice_to_have: ["graphql"],
      },
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Score ATS" }).click();

  await page
    .locator(".ats-modal .form-textarea")
    .fill("Développeur React TypeScript Docker Kubernetes");

  // Analyse locale : un cercle de score apparaît.
  await page.locator(".ats-modal").getByRole("button", { name: "Analyser", exact: true }).click();
  await expect(page.locator(".ats-score-circle")).toBeVisible();

  // Analyse IA : le badge et le score mocké (82) s'affichent.
  await page.getByRole("button", { name: /Analyser avec l'IA/ }).click();
  await expect(page.getByText("✨ Analyse IA")).toBeVisible();
  await expect(page.locator(".ats-score-circle")).toHaveText("82");
});
