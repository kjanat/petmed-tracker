import { Heart, Home, QrCode, User } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface MobileLayoutProps {
	children: React.ReactNode;
	activeTab?: "home" | "pets" | "qr" | "profile";
}

export default function MobileLayout({
	children,
	activeTab = "home",
}: MobileLayoutProps) {
	const { data: session } = useSession();

	if (!session) {
		return <div className="min-h-screen bg-gray-50">{children}</div>;
	}

	return (
		<div className="min-h-screen bg-gray-50 pb-20">
			{/* Header */}
			<header className="sticky top-0 z-40 border-b bg-white shadow-sm">
				<div className="px-4 py-3">
					<h1 className="font-semibold text-gray-900 text-xl">
						PetMed Tracker
					</h1>
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-1">{children}</main>

			{/* Bottom Navigation */}
			<nav className="fixed right-0 bottom-0 left-0 border-gray-200 border-t bg-white px-4 py-2">
				<div className="flex justify-around">
					<Link
						href="/"
						className={`flex flex-col items-center rounded-lg px-3 py-2 transition-colors ${
							activeTab === "home"
								? "bg-blue-50 text-blue-600"
								: "text-gray-600 hover:text-gray-900"
						}`}
					>
						<Home size={20} />
						<span className="mt-1 text-xs">Home</span>
					</Link>

					<Link
						href="/pets"
						className={`flex flex-col items-center rounded-lg px-3 py-2 transition-colors ${
							activeTab === "pets"
								? "bg-blue-50 text-blue-600"
								: "text-gray-600 hover:text-gray-900"
						}`}
					>
						<Heart size={20} />
						<span className="mt-1 text-xs">Pets</span>
					</Link>

					<Link
						href="/qr-scanner"
						className={`flex flex-col items-center rounded-lg px-3 py-2 transition-colors ${
							activeTab === "qr"
								? "bg-blue-50 text-blue-600"
								: "text-gray-600 hover:text-gray-900"
						}`}
					>
						<QrCode size={20} />
						<span className="mt-1 text-xs">QR Code</span>
					</Link>

					<Link
						href="/profile"
						className={`flex flex-col items-center rounded-lg px-3 py-2 transition-colors ${
							activeTab === "profile"
								? "bg-blue-50 text-blue-600"
								: "text-gray-600 hover:text-gray-900"
						}`}
					>
						<User size={20} />
						<span className="mt-1 text-xs">Profile</span>
					</Link>
				</div>
			</nav>
		</div>
	);
}
