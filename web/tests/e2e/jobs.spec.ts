import { test, expect } from "@playwright/test";

/**
 * Onglet « Offres » (backend `/api/jobs/*` mocké via `page.route`). Vérifie : le scan affiche une
 * carte notée, « Adapter mon CV » ouvre l'éditeur avec la modale pré-remplie, « Masquer » retire
 * la carte, et l'écran de configuration s'affiche si les clés manquent.
 */

const OFFER = {
  id: "1",
  title: "Webmaster SEO",
  company: "ACME",
  location: "75 - Paris",
  commuteDestination: "48.8,2.3",
  url: "https://example.fr/offre/1",
  jobText: "Offre de Webmaster SEO chez ACME, missions SEO et WordPress.",
};

async function mockScanOk(page: import("@playwright/test").Page) {
  await page.route("**/api/jobs/search", (route) =>
    route.fulfill({ json: { offers: [OFFER], scoreLimit: 40, minScore: 70 } }),
  );
  await page.route("**/api/jobs/score", (route) =>
    route.fulfill({
      json: { score: 88, breakdown: { total_score: 88 }, commute: { transit: "25 min" }, commuteText: "TC: 25 min" },
    }),
  );
}

test("le scan affiche une offre notée", async ({ page }) => {
  await mockScanOk(page);
  await page.goto("/jobs");
  await page.getByTestId("jobs-scan").click();

  const card = page.getByTestId("job-card");
  await expect(card).toHaveCount(1);
  await expect(card).toContainText("Webmaster SEO");
  await expect(card).toContainText("88");
  await expect(card).toContainText("TC: 25 min");
});

test("« Adapter mon CV » ouvre l'éditeur avec la modale pré-remplie", async ({ page }) => {
  await mockScanOk(page);
  await page.goto("/jobs");
  await page.getByTestId("jobs-scan").click();
  await expect(page.getByTestId("job-card")).toHaveCount(1);

  await page.getByTestId("job-adapt").click();

  // Navigation vers l'éditeur + TailorModal pré-remplie avec le texte de l'offre.
  await expect(page.locator("#job-desc-input")).toHaveValue(/Webmaster SEO chez ACME/);
});

test("« Masquer » retire l'offre", async ({ page }) => {
  await mockScanOk(page);
  await page.goto("/jobs");
  await page.getByTestId("jobs-scan").click();
  await expect(page.getByTestId("job-card")).toHaveCount(1);

  await page.getByTestId("job-dismiss").click();
  await expect(page.getByTestId("job-card")).toHaveCount(0);
});

test("écran de configuration si les clés manquent", async ({ page }) => {
  await page.route("**/api/jobs/search", (route) =>
    route.fulfill({ status: 400, json: { error: "config", message: "Configurez FT_CLIENT_ID et FT_CLIENT_SECRET." } }),
  );
  await page.goto("/jobs");
  await page.getByTestId("jobs-scan").click();
  await expect(page.getByTestId("jobs-config")).toContainText("Configurez FT_CLIENT_ID");
});
