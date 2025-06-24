"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { api } from "@/trpc/react";
import MobileLayout from "@/components/MobileLayout";
import { Clock, AlertCircle, CheckCircle, Plus } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { data: session, status } = useSession();
  const { data: pets } = api.pet.getMyPets.useQuery(undefined, {
    enabled: !!session,
  });

  if (status === "loading") {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </MobileLayout>
    );
  }

  if (!session) {
    return (
      <MobileLayout>
        <div className="px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to PetMed Tracker</h2>
            <p className="text-gray-600 mb-8">
              Keep track of your pet's medication schedule and never miss a dose.
            </p>
            <button
              onClick={() => signIn("discord")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Sign In with Discord
            </button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (!pets || pets.length === 0) {
    return (
      <MobileLayout activeTab="home">
        <div className="px-4 py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">No pets yet</h2>
            <p className="text-gray-600 mb-6">
              Add your first pet to start tracking their medication schedule.
            </p>
            <Link
              href="/pets/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Add Your First Pet
            </Link>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout activeTab="home">
      <div className="px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome back, {session.user.name}!
          </h2>
          <p className="text-gray-600">Here's today's medication schedule</p>
        </div>

        {/* Today's Schedule for Each Pet */}
        <div className="space-y-6">
          {pets.map((pet) => (
            <PetTodaySchedule key={pet.id} pet={pet} />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <Link
            href="/pets/new"
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow"
          >
            <Plus className="mx-auto mb-2 text-blue-600" size={24} />
            <span className="text-sm font-medium text-gray-900">Add Pet</span>
          </Link>
          
          <Link
            href="/qr-scanner"
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow"
          >
            <Clock className="mx-auto mb-2 text-green-600" size={24} />
            <span className="text-sm font-medium text-gray-900">Scan QR</span>
          </Link>
        </div>
      </div>
    </MobileLayout>
  );
}

function PetTodaySchedule({ pet }: { pet: any }) {
  const { data: todaySchedule } = api.medication.getTodaySchedule.useQuery(
    { petId: pet.id },
    { refetchInterval: 30000 } // Refresh every 30 seconds
  );

  const logMedicationMutation = api.medication.logMedication.useMutation({
    onSuccess: () => {
      // Refetch the schedule after logging medication
      window.location.reload();
    },
  });

  const handleGiveMedication = (item: any) => {
    logMedicationMutation.mutate({
      medicationId: item.medicationId,
      scheduledTime: new Date(item.scheduledTime),
      status: "given",
    });
  };

  if (!todaySchedule || todaySchedule.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-2">{pet.name}</h3>
        <p className="text-gray-600 text-sm">No medications scheduled for today</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-4">{pet.name}</h3>
      
      <div className="space-y-3">
        {todaySchedule.map((item: any, index: number) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-lg border border-gray-100"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {item.status === "given" ? (
                  <CheckCircle size={16} className="text-green-600" />
                ) : item.status === "missed" ? (
                  <AlertCircle size={16} className="text-red-600" />
                ) : (
                  <Clock size={16} className="text-gray-400" />
                )}
                <span className="font-medium text-gray-900">{item.medicationName}</span>
              </div>
              
              <div className="text-sm text-gray-600">
                <div>
                  {new Date(item.scheduledTime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                  {item.dosage && ` • ${item.dosage}${item.unit ? ` ${item.unit}` : ''}`}
                </div>
                
                {item.status === "given" && item.givenBy && (
                  <div className="text-green-600 text-xs mt-1">
                    Given by {item.givenBy.name} at{' '}
                    {new Date(item.actualTime).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </div>
                )}
              </div>
            </div>

            {item.status === "pending" && (
              <button
                onClick={() => handleGiveMedication(item)}
                disabled={logMedicationMutation.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {logMedicationMutation.isPending ? "..." : "Give"}
              </button>
            )}
          </div>
        ))}
      </div>

      <Link
        href={`/pets/${pet.id}`}
        className="inline-block mt-4 text-blue-600 text-sm font-medium hover:text-blue-700"
      >
        View {pet.name}'s full schedule →
      </Link>
    </div>
  );
}
