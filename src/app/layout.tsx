import "@/styles/globals.css";

import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import PWAInstaller from "@/components/PWAInstaller";

import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
	title: "PetMed Tracker",
	description: "Track your pet's medication schedule and never miss a dose",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
	manifest: "/manifest.json",
	keywords: ["pet", "medication", "tracker", "veterinary", "schedule", "reminder"],
	authors: [{ name: "Pet Medication Tracker Team" }],
	creator: "Pet Medication Tracker",
	publisher: "Pet Medication Tracker",
	metadataBase: new URL("https://petmed-tracker.vercel.app"),
	openGraph: {
		title: "Pet Medication Tracker",
		description: "Track your pet's medication schedule and never miss a dose",
		siteName: "Pet Medication Tracker",
		locale: "en_US",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Pet Medication Tracker",
		description: "Track your pet's medication schedule and never miss a dose",
	},
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "PetMed Tracker",
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={`${geist.variable}`}>
			<body>
				<SessionProvider>
					<TRPCReactProvider>
						{children}
						<Toaster
							position="top-center"
							toastOptions={{
								duration: 4000,
								style: {
									background: '#363636',
									color: '#fff',
								},
							}}
						/>
						<PWAInstaller />
					</TRPCReactProvider>
				</SessionProvider>
			</body>
		</html>
	);
}
