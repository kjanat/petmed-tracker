"use client";

import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import MobileLayout from "@/components/MobileLayout";
import { User, LogOut, Settings, Shield, Heart, Bell, Info } from "lucide-react";

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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Not signed in</h2>
            <p className="text-gray-600">Please sign in to view your profile.</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout activeTab="profile">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="text-blue-600" size={32} />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {session.user.name || "Anonymous User"}
              </h2>
              <p className="text-gray-600 text-sm">{session.user.email}</p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4">
          {/* Account Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Settings className="text-gray-600" size={20} />
                <h3 className="font-semibold text-gray-900">Account Settings</h3>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Bell size={16} className="text-gray-500" />
                  <span className="text-gray-700">Notifications</span>
                </div>
                <span className="text-gray-400 text-sm">Coming Soon</span>
              </button>
              
              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Shield size={16} className="text-gray-500" />
                  <span className="text-gray-700">Privacy Settings</span>
                </div>
                <span className="text-gray-400 text-sm">Coming Soon</span>
              </button>
            </div>
          </div>

          {/* App Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Info className="text-gray-600" size={20} />
                <h3 className="font-semibold text-gray-900">App Information</h3>
              </div>
            </div>
            <div className="p-4 space-y-3">
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Heart className="text-gray-600" size={20} />
                <h3 className="font-semibold text-gray-900">Your Activity</h3>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">--</div>
                  <div className="text-sm text-gray-600">Pets</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">--</div>
                  <div className="text-sm text-gray-600">Doses Given</div>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-3">
                Stats will update as you use the app
              </p>
            </div>
          </div>

          {/* Sign Out */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full p-4 flex items-center justify-center gap-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSigningOut ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
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
          <p className="text-xs text-gray-500">
            PetMed Tracker • Built with ❤️ for pet parents
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Never miss a dose, never miss a moment
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}
