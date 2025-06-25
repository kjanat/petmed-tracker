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
		// WebKit disabled due to missing system dependencies
	],
	webServer: {
		command: "bun run dev",
		cwd: new URL(".", import.meta.url).pathname,
		timeout: 120 * 1000,
		env: {
			SKIP_ENV_VALIDATION: "true",
			AUTH_SECRET: "placeholder",
			AUTH_DISCORD_ID: "1",
			AUTH_DISCORD_SECRET: "1",
			DATABASE_URL: "file:./dev.db",
		},
		port: 3000,
		reuseExistingServer: !process.env.CI,
	},
});
