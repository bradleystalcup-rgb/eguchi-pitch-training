import { expect, test } from "@playwright/test";

test.describe("practice API auth wall", () => {
  test("signed-out users cannot update learner levels", async ({ request }) => {
    const response = await request.patch("/api/children/demo-child/level", {
      data: { level: 2 },
    });

    expect(response.status()).toBe(401);
  });

  test("signed-out users cannot create practice sessions", async ({ request }) => {
    const response = await request.post("/api/children/demo-child/practice-sessions", {
      data: { level: 2 },
    });

    expect(response.status()).toBe(401);
  });

  test("signed-out users cannot save attempts", async ({ request }) => {
    const response = await request.post("/api/practice-sessions/demo-session/attempts", {
      data: {
        trialIndex: 0,
        promptChordSlug: "white-red-ceg",
        selectedChordSlug: "white-red-ceg",
        responseMs: 1200,
      },
    });

    expect(response.status()).toBe(401);
  });

  test("signed-out users cannot complete sessions", async ({ request }) => {
    const response = await request.post("/api/practice-sessions/demo-session/complete");

    expect(response.status()).toBe(401);
  });
});
