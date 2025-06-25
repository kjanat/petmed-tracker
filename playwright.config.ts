import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	retries: process.env.CI ? 2 : 0,
	use: {
		baseURL: "http://localhost:3000",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] },
		},
		{
			name: "webkit",
			use: { ...devices["Desktop Safari"] },
		},
	],
	webServer: {
		command: "bun run dev",
		port: 3000,
		reuseExistingServer: !process.env.CI,
	},
});
