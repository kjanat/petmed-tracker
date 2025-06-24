"use client";

import {
	Bell,
	Heart,
	Info,
	LogOut,
	Settings,
	Shield,
	User,
} from "lucide-react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import MobileLayout from "@/components/MobileLayout";

export default function ProfilePage() {
	const { data: session } = useSession();
	const [isSigningOut, setIsSigningOut] = useState(false);

	const handleSignOut = async () => {
		setIsSigningOut(true);
		try {
			await signOut({ callbackUrl: "/" });
		} catch (error) {
			console.error("Sign out error:", error);
			setIsSigningOut(false);
		}
	};

	if (!session) {
		return (
			<MobileLayout activeTab="profile">
				<div className="px-4 py-8">
					<div className="text-center">
						<User className="mx-auto mb-4 text-gray-400" size={48} />
						<h2 className="mb-4 font-semibold text-gray-900 text-xl">
							Not signed in
						</h2>
						<p className="text-gray-600">
							Please sign in to view your profile.
						</p>
					</div>
				</div>
			</MobileLayout>
		);
	}

	return (
		<MobileLayout activeTab="profile">
			<div className="px-4 py-6">
				{/* Header */}
				<div className="mb-6 flex items-center gap-3">
					<h1 className="font-bold text-2xl text-gray-900">Profile</h1>
				</div>

				{/* User Info Card */}
				<div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<div className="mb-4 flex items-center gap-4">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
							{session.user.image ? (
								<Image
									src={session.user.image}
									alt="Profile"
									width={64}
									height={64}
									className="h-16 w-16 rounded-full object-cover"
								/>
							) : (
								<User className="text-blue-600" size={32} />
							)}
						</div>
						<div>
							<h2 className="font-semibold text-gray-900 text-lg">
								{session.user.name || "Anonymous User"}
							</h2>
							<p className="text-gray-600 text-sm">{session.user.email}</p>
						</div>
					</div>
				</div>

				{/* Settings Sections */}
				<div className="space-y-4">
					{/* Account Settings */}
					<div className="rounded-lg border border-gray-200 bg-white shadow-sm">
						<div className="border-gray-100 border-b p-4">
							<div className="flex items-center gap-3">
								<Settings className="text-gray-600" size={20} />
								<h3 className="font-semibold text-gray-900">
									Account Settings
								</h3>
							</div>
						</div>
						<div className="space-y-3 p-4">
							<button
								type="button"
								className="flex w-full items-center justify-between rounded-lg p-3 transition-colors hover:bg-gray-50"
							>
								<div className="flex items-center gap-3">
									<Bell size={16} className="text-gray-500" />
									<span className="text-gray-700">Notifications</span>
								</div>
								<span className="text-gray-400 text-sm">Coming Soon</span>
							</button>

							<button
								type="button"
								className="flex w-full items-center justify-between rounded-lg p-3 transition-colors hover:bg-gray-50"
							>
								<div className="flex items-center gap-3">
									<Shield size={16} className="text-gray-500" />
									<span className="text-gray-700">Privacy Settings</span>
								</div>
								<span className="text-gray-400 text-sm">Coming Soon</span>
							</button>
						</div>
					</div>

					{/* App Info */}
					<div className="rounded-lg border border-gray-200 bg-white shadow-sm">
						<div className="border-gray-100 border-b p-4">
							<div className="flex items-center gap-3">
								<Info className="text-gray-600" size={20} />
								<h3 className="font-semibold text-gray-900">App Information</h3>
							</div>
						</div>
						<div className="space-y-3 p-4">
							<div className="flex items-center justify-between">
								<span className="text-gray-700">Version</span>
								<span className="text-gray-600 text-sm">1.0.0 Beta</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-gray-700">Build</span>
								<span className="text-gray-600 text-sm">T3 Stack</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-gray-700">Database</span>
								<span className="text-gray-600 text-sm">SQLite + Prisma</span>
							</div>
						</div>
					</div>

					{/* Quick Stats */}
					<div className="rounded-lg border border-gray-200 bg-white shadow-sm">
						<div className="border-gray-100 border-b p-4">
							<div className="flex items-center gap-3">
								<Heart className="text-gray-600" size={20} />
								<h3 className="font-semibold text-gray-900">Your Activity</h3>
							</div>
						</div>
						<div className="p-4">
							<div className="grid grid-cols-2 gap-4 text-center">
								<div className="rounded-lg bg-blue-50 p-3">
									<div className="mb-1 font-bold text-2xl text-blue-600">
										--
									</div>
									<div className="text-gray-600 text-sm">Pets</div>
								</div>
								<div className="rounded-lg bg-green-50 p-3">
									<div className="mb-1 font-bold text-2xl text-green-600">
										--
									</div>
									<div className="text-gray-600 text-sm">Doses Given</div>
								</div>
							</div>
							<p className="mt-3 text-center text-gray-500 text-xs">
								Stats will update as you use the app
							</p>
						</div>
					</div>

					{/* Sign Out */}
					<div className="rounded-lg border border-gray-200 bg-white shadow-sm">
						<button
							type="button"
							onClick={handleSignOut}
							disabled={isSigningOut}
							className="flex w-full items-center justify-center gap-3 rounded-lg p-4 text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isSigningOut ? (
								<>
									<div className="h-4 w-4 animate-spin rounded-full border-red-600 border-b-2" />
									Signing out...
								</>
							) : (
								<>
									<LogOut size={16} />
									Sign Out
								</>
							)}
						</button>
					</div>
				</div>

				{/* Footer Info */}
				<div className="mt-8 text-center">
					<p className="text-gray-500 text-xs">
						PetMed Tracker • Built with ❤️ for pet parents
					</p>
					<p className="mt-1 text-gray-400 text-xs">
						Never miss a dose, never miss a moment
					</p>
				</div>
			</div>
		</MobileLayout>
	);
}
