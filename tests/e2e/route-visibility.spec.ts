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

  test("dashboard route redirects signed-out visitors to sign in", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/sign in to keep practicing/i),
    ).toBeVisible();
  });

  test("training route redirects signed-out visitors to sign in", async ({
    page,
  }) => {
    await page.goto("/train/demo-child");

    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/sign in to keep practicing/i),
    ).toBeVisible();
  });
});
