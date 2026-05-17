import { expect, test } from "@playwright/test";

test.describe("core route visibility", () => {
  test("public landing page shows child-friendly pitch training copy", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /eguchi pitch training/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/practice your pitch/i),
    ).toBeVisible();
  });

  test("auth page invites learners to start practicing", async ({ page }) => {
    await page.goto("/sign-in");

    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/sign in to keep practicing/i),
    ).toBeVisible();
  });

  test("dashboard route shows the learner practice placeholder", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", { name: /your practice dashboard/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/see your next pitch practice/i),
    ).toBeVisible();
  });

  test("training route shows the practice room placeholder", async ({
    page,
  }) => {
    await page.goto("/train/demo-child");

    await expect(
      page.getByRole("heading", { name: /practice room/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/warm up your ears/i),
    ).toBeVisible();
  });
});
