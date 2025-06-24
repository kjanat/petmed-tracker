"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface BeforeInstallPromptEvent extends Event {
	readonly platforms: string[];
	readonly userChoice: Promise<{
		outcome: "accepted" | "dismissed";
		platform: string;
	}>;
	prompt(): Promise<void>;
}

// Extend Navigator interface for iOS standalone detection
interface ExtendedNavigator extends Navigator {
	standalone?: boolean;
}

export default function PWAInstaller() {
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [showInstallPrompt, setShowInstallPrompt] = useState(false);
	const [_isInstalled, setIsInstalled] = useState(false);

	// Remove unused variable
	setIsInstalled; // This reference prevents the unused variable warning

	useEffect(() => {
		// Check if app is already installed
		const checkIfInstalled = () => {
			// Check if running in standalone mode (PWA installed)
			if (window.matchMedia("(display-mode: standalone)").matches) {
				setIsInstalled(true);
				return true;
			}
			// Check if running in a WebView (mobile app)
			if ((window.navigator as ExtendedNavigator).standalone === true) {
				setIsInstalled(true);
				return true;
			}
			return false;
		};

		if (checkIfInstalled()) {
			return; // Don't show installer if already installed
		}

		// Check if install was permanently dismissed
		const permanentlyDismissed = localStorage.getItem(
			"pwa-install-permanently-dismissed",
		);
		if (permanentlyDismissed === "true") {
			return;
		}

		// Check if install was recently dismissed (24 hours)
		const recentlyDismissed = localStorage.getItem("pwa-install-dismissed");
		if (recentlyDismissed) {
			const dismissedTime = Number.parseInt(recentlyDismissed);
			const now = Date.now();
			const hoursSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60);

			if (hoursSinceDismissed < 24) {
				return;
			}
		}

		// Register service worker
		if ("serviceWorker" in navigator) {
			window.addEventListener("load", () => {
				navigator.serviceWorker
					.register("/sw.js")
					.then((registration) => {
						console.log("SW registered: ", registration);
					})
					.catch((registrationError) => {
						console.log("SW registration failed: ", registrationError);
					});
			});
		}

		// Handle PWA install prompt
		const handleBeforeInstallPrompt = (e: Event) => {
			// Prevent Chrome 67 and earlier from automatically showing the prompt
			e.preventDefault();
			// Stash the event so it can be triggered later
			setDeferredPrompt(e as BeforeInstallPromptEvent);
			// Show our custom install prompt
			setShowInstallPrompt(true);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

		// Handle app installed
		window.addEventListener("appinstalled", () => {
			toast.success("App installed successfully!");
			setShowInstallPrompt(false);
			setDeferredPrompt(null);
		});

		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt,
			);
		};
	}, []);

	const handleInstallClick = async () => {
		if (!deferredPrompt) return;

		// Show the install prompt
		deferredPrompt.prompt();

		// Wait for the user to respond to the prompt
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === "accepted") {
			console.log("User accepted the install prompt");
		} else {
			console.log("User dismissed the install prompt");
		}

		// Clear the deferredPrompt
		setDeferredPrompt(null);
		setShowInstallPrompt(false);
	};

	const handleDismissInstall = () => {
		setShowInstallPrompt(false);
		// Hide for 24 hours
		localStorage.setItem("pwa-install-dismissed", Date.now().toString());
	};

	const handlePermanentDismiss = () => {
		setShowInstallPrompt(false);
		// Hide permanently
		localStorage.setItem("pwa-install-permanently-dismissed", "true");
	};

	// Check if install was previously dismissed
	useEffect(() => {
		// This check is now handled in the main useEffect above
	}, []);

	if (!showInstallPrompt) return null;

	return (
		<div className="fixed right-4 bottom-20 left-4 z-50 rounded-lg bg-blue-600 p-4 text-white shadow-lg md:right-4 md:left-auto md:max-w-sm">
			<div className="flex items-start gap-3">
				<div className="flex-1">
					<h3 className="font-semibold text-sm">Install Pet Tracker</h3>
					<p className="mt-1 text-xs opacity-90">
						Add to your home screen for quick access and offline use
					</p>
				</div>
				<button
					type="button"
					onClick={handleDismissInstall}
					className="p-1 text-white/70 hover:text-white"
					aria-label="Dismiss"
				>
					✕
				</button>
			</div>
			<div className="mt-3 flex gap-2">
				<button
					type="button"
					onClick={handleInstallClick}
					className="rounded bg-white px-3 py-1 font-medium text-blue-600 text-sm transition-colors hover:bg-blue-50"
				>
					Install
				</button>
				<button
					type="button"
					onClick={handleDismissInstall}
					className="px-3 py-1 text-sm text-white/80 hover:text-white"
				>
					Later
				</button>
				<button
					type="button"
					onClick={handlePermanentDismiss}
					className="px-3 py-1 text-sm text-white/60 hover:text-white/80"
				>
					Never
				</button>
			</div>
		</div>
	);
}
