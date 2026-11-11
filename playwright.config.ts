import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3100);
const desktop = { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } };
const phone = { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 4,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, reducedMotion: "reduce" },
  webServer: {
    command: `pnpm exec next start -p ${PORT}`,
    url: `http://localhost:${PORT}/prototype`,
    reuseExistingServer: true,
    timeout: 180_000,
    env: {
      ...process.env,
      // next start runs as production; force local mail into Mailpit/Inbucket for browser checks.
      MAILPIT_URL: process.env.MAILPIT_URL ?? "http://127.0.0.1:54324",
    },
  },
  projects: [
    { name: "a11y-desktop", testMatch: /e2e[\\/]a11y\.spec\.ts/, use: desktop },
    { name: "a11y-phone", testMatch: /e2e[\\/]a11y\.spec\.ts/, use: phone },
    { name: "staff", testMatch: /e2e[\\/]staff\.spec\.ts/, use: desktop, workers: 1 },
    { name: "live-a11y", testMatch: /e2e[\\/]live-a11y\.spec\.ts/, use: desktop, workers: 1, dependencies: ["staff"] },
    { name: "media", testMatch: /e2e[\\/]media\.spec\.ts/, use: desktop, workers: 1, dependencies: ["live-a11y"] },
    { name: "public", testMatch: /e2e[\\/](public|homepage)\.spec\.ts/, use: desktop, workers: 1, dependencies: ["media"] },
    { name: "quotes", testMatch: /e2e[\\/]quotes\.spec\.ts/, use: desktop, workers: 1, dependencies: ["public"] },
    { name: "keyboard", testMatch: /keyboard\.spec\.ts/, use: desktop },
    { name: "screenshots", testMatch: /screenshots\.spec\.ts/, use: desktop },
  ],
});
