import "@testing-library/jest-dom/vitest";

// Set default env vars for tests
if (!process.env.NODE_ENV) {
	process.env.NODE_ENV = "test";
}
process.env.SKIP_ENV_VALIDATION = "true";
