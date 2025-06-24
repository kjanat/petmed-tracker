"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/trpc/react";
import MobileLayout from "@/components/MobileLayout";
import {
  Pill,
  Plus,
  Edit3,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Activity,
  Trash2,
  Settings,
} from "lucide-react";

export default function PetMedicationsPage() {
  const params = useParams();
  const router = useRouter();
  const petId = params.id as string;
  
  const [selectedMed, setSelectedMed] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const { data: pet } = api.pet.getById.useQuery({ id: petId });
  const { data: medications, isLoading, refetch } = api.medication.getByPet.useQuery({ petId });
  
  const updateMedicationMutation = api.medication.update.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  if (isLoading) {
    return (
      <MobileLayout activeTab="pets">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </MobileLayout>
    );
  }

  if (!pet) {
    return (
      <MobileLayout activeTab="pets">
        <div className="px-4 py-8 text-center">
          <Pill className="mx-auto mb-4 text-gray-400" size={48} />
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pet not found</h2>
          <Link
            href="/pets"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Pets
          </Link>
        </div>
      </MobileLayout>
    );
  }

  const activeMedications = medications?.filter(m => m.isActive) || [];
  const inactiveMedications = medications?.filter(m => !m.isActive) || [];
  const displayMedications = showInactive ? medications || [] : activeMedications;

  return (
    <MobileLayout activeTab="pets">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ←
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Medications</h1>
              <p className="text-sm text-gray-600">{pet.name}</p>
            </div>
          </div>
          
          <Link
            href={`/pets/${petId}/medications/new`}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setShowInactive(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !showInactive
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Active ({activeMedications.length})
          </button>
          
          {inactiveMedications.length > 0 && (
            <button
              onClick={() => setShowInactive(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showInactive
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({medications?.length || 0})
            </button>
          )}
        </div>

        {/* Empty State */}
        {displayMedications.length === 0 && (
          <div className="text-center py-12">
            <Pill className="mx-auto mb-4 text-gray-400" size={48} />
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {showInactive ? "No medications yet" : "No active medications"}
            </h2>
            <p className="text-gray-600 mb-6">
              {showInactive 
                ? `Add ${pet.name}'s first medication to start tracking doses and schedules.`
                : `All of ${pet.name}'s medications are currently inactive.`
              }
            </p>
            <Link
              href={`/pets/${petId}/medications/new`}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Add Medication
            </Link>
          </div>
        )}

        {/* Medications List */}
        <div className="space-y-4">
          {displayMedications.map((medication) => (
            <div
              key={medication.id}
              className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${
                !medication.isActive ? "opacity-75" : ""
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {medication.name}
                    </h3>
                    {!medication.isActive && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  
                  {medication.dosage && (
                    <p className="text-gray-600 text-sm mb-1">
                      {medication.dosage}
                      {medication.unit && ` ${medication.unit}`}
                    </p>
                  )}
                  
                  {medication.instructions && (
                    <p className="text-gray-500 text-sm">
                      {medication.instructions}
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() => setSelectedMed(
                    selectedMed === medication.id ? null : medication.id
                  )}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MoreVertical size={16} />
                </button>
              </div>

              {/* Schedules */}
              {medication.schedules && medication.schedules.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Schedules ({medication.schedules.length})
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {medication.schedules.slice(0, 2).map((schedule) => {
                      const times = schedule.times ? JSON.parse(schedule.times) : [];
                      const daysOfWeek = schedule.daysOfWeek ? JSON.parse(schedule.daysOfWeek) : null;
                      
                      return (
                        <div
                          key={schedule.id}
                          className="flex items-center justify-between p-2 bg-blue-50 rounded-lg text-sm"
                        >
                          <div>
                            <div className="font-medium text-blue-900">
                              {schedule.scheduleType} schedule
                            </div>
                            <div className="text-blue-700">
                              {times.length > 0 && `at ${times.join(', ')}`}
                              {daysOfWeek && ` • ${daysOfWeek.length} days/week`}
                            </div>
                          </div>
                          <div className="text-xs text-blue-600">
                            {schedule.isActive ? "Active" : "Inactive"}
                          </div>
                        </div>
                      );
                    })}
                    
                    {medication.schedules.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{medication.schedules.length - 2} more schedules
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recent Logs */}
              {medication.logs && medication.logs.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Recent Doses
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {medication.logs.slice(0, 3).map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-2 bg-green-50 rounded-lg text-sm"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle size={12} className="text-green-600" />
                            <span className="font-medium text-green-900">
                              {log.status === "given" ? "Dose given" : `Status: ${log.status}`}
                            </span>
                          </div>
                          <div className="text-green-700 text-xs">
                            {log.actualTime ? new Date(log.actualTime).toLocaleString() : new Date(log.createdAt).toLocaleString()}
                            {log.givenBy && ` • by ${log.givenBy.name || log.givenBy.email}`}
                          </div>
                        </div>
                        
                        <div className="text-xs text-green-600">
                          {log.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  {medication.logs && medication.logs.length > 0 ? (
                    <>
                      <CheckCircle size={16} className="text-green-600" />
                      <span className="text-sm text-green-700">
                        Last dose: {medication.logs[0]!.actualTime 
                          ? new Date(medication.logs[0]!.actualTime).toLocaleDateString()
                          : new Date(medication.logs[0]!.createdAt).toLocaleDateString()
                        }
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} className="text-amber-600" />
                      <span className="text-sm text-amber-700">
                        No doses recorded
                      </span>
                    </>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Link
                    href={`/pets/${petId}/medications/${medication.id}/edit`}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Edit
                  </Link>
                  
                  <Link
                    href={`/pets/${petId}/medications/${medication.id}/log`}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Log Dose
                  </Link>
                </div>
              </div>

              {/* Action Menu */}
              {selectedMed === medication.id && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/pets/${petId}/medications/${medication.id}/schedule`}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Calendar size={16} />
                      Manage Schedule
                    </Link>
                    
                    <Link
                      href={`/pets/${petId}/medications/${medication.id}/history`}
                      className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 text-sm rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <Activity size={16} />
                      View History
                    </Link>
                    
                    <button
                      onClick={() => {
                        updateMedicationMutation.mutate({
                          id: medication.id,
                          isActive: !medication.isActive,
                        });
                      }}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                        medication.isActive
                          ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "bg-green-50 text-green-700 hover:bg-green-100"
                      }`}
                    >
                      <Settings size={16} />
                      {medication.isActive ? "Deactivate" : "Activate"}
                    </button>
                    
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${medication.name}? This action cannot be undone.`)) {
                          // Delete mutation would go here
                          // For now, just deactivate
                          updateMedicationMutation.mutate({
                            id: medication.id,
                            isActive: false,
                          });
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 text-sm rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        {displayMedications.length > 0 && (
          <div className="mt-8 mb-20">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href={`/pets/${petId}/medications/new`}
                  className="flex items-center gap-2 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={20} />
                  <span>Add Medication</span>
                </Link>
                
                <Link
                  href={`/pets/${petId}/medications/schedule`}
                  className="flex items-center gap-2 bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Calendar size={20} />
                  <span>Schedule View</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
