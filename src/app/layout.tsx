import "@/styles/globals.css";

import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
	title: "PetMed Tracker",
	description: "Track your pet's medication schedule and never miss a dose",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
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
					</TRPCReactProvider>
				</SessionProvider>
			</body>
		</html>
	);
}
