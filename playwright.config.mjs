// Tests for art.ivolopes.com (npm test). WebGL runs in software (SwiftShader)
// so the 3D clay renders the same on CI as on a laptop.
import { defineConfig, devices } from "@playwright/test";

const gl = { launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] } };

export default defineConfig({
  testDir: "tests",
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL: "http://localhost:4174", trace: "retain-on-failure", ...gl },
  webServer: { command: "python3 -m http.server 4174", url: "http://localhost:4174", reuseExistingServer: !process.env.CI },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], ...gl } },
    { name: "phone", use: { ...devices["Pixel 7"], ...gl } },
  ],
});
