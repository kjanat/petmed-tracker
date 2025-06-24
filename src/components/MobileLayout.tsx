import Link from "next/link";
import { Home, Heart, QrCode, Settings, User } from "lucide-react";
import { useSession } from "next-auth/react";

interface MobileLayoutProps {
  children: React.ReactNode;
  activeTab?: "home" | "pets" | "qr" | "profile";
}

export default function MobileLayout({ children, activeTab = "home" }: MobileLayoutProps) {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-3">
          <h1 className="text-xl font-semibold text-gray-900">PetMed Tracker</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          <Link
            href="/"
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              activeTab === "home"
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Home size={20} />
            <span className="text-xs mt-1">Home</span>
          </Link>

          <Link
            href="/pets"
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              activeTab === "pets"
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Heart size={20} />
            <span className="text-xs mt-1">Pets</span>
          </Link>

          <Link
            href="/qr-scanner"
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              activeTab === "qr"
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <QrCode size={20} />
            <span className="text-xs mt-1">QR Code</span>
          </Link>

          <Link
            href="/profile"
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              activeTab === "profile"
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <User size={20} />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
