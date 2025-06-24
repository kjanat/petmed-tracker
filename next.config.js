/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
	enabled: process.env.ANALYZE === "true",
	openAnalyzer: false, // Don't auto-open browser
});

/** @type {import("next").NextConfig} */
const config = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "cdn.discordapp.com",
				port: undefined,
				pathname: "/avatars/**",
			},
		],
	},
};

export default withBundleAnalyzer(config);
