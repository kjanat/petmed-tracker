import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	test: {
		include: [
			"src/**/*.test.{ts,tsx}",
			"src/**/*.spec.{ts,tsx}",
			"tests/**/*.test.{ts,tsx}",
		],
		environment: "jsdom",
		globals: true,
		setupFiles: ["./tests/setup.ts"],
		exclude: ["e2e/**"],
		coverage: {
			enabled: false,
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(process.cwd(), "src"),
		},
	},
});
