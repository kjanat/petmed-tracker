"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/trpc/react";
import MobileLayout from "@/components/MobileLayout";
import {
  Heart,
  Calendar,
  Clock,
  Users,
  Pill,
  Edit3,
  Plus,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  User,
  Weight,
  Baby,
  Stethoscope,
  Activity,
  QrCode,
  Settings,
  FileText,
} from "lucide-react";
import QRCode from "react-qr-code";

export default function PetDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const petId = params.id as string;
  
  const [showQr, setShowQr] = useState(false);
  const [editingPet, setEditingPet] = useState(false);
  const [showAddCaregiver, setShowAddCaregiver] = useState(false);
  const [caregiverEmail, setCaregiverEmail] = useState("");

  const { data: pet, isLoading, refetch } = api.pet.getById.useQuery({ id: petId });
  const { data: medications } = api.medication.getByPet.useQuery({ petId });
  
  const updatePetMutation = api.pet.update.useMutation({
    onSuccess: () => {
      setEditingPet(false);
      refetch();
    },
  });

  const addCaregiverMutation = api.pet.addCaregiver.useMutation({
    onSuccess: () => {
      setShowAddCaregiver(false);
      setCaregiverEmail("");
      refetch();
    },
  });

  const removeCaregiverMutation = api.pet.removeCaregiver.useMutation({
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
          <Heart className="mx-auto mb-4 text-gray-400" size={48} />
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pet not found</h2>
          <p className="text-gray-600 mb-6">
            This pet doesn't exist or you don't have access to it.
          </p>
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
  const recentLogs = medications?.flatMap(m => m.logs).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 10) || [];

  return (
    <MobileLayout activeTab="pets">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ←
          </button>
          <h1 className="text-xl font-bold text-gray-900">{pet.name}</h1>
          <button
            onClick={() => setEditingPet(true)}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit3 size={20} />
          </button>
        </div>

        {/* Pet Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Heart className="text-blue-600" size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">{pet.name}</h2>
              {pet.species && (
                <p className="text-gray-600 text-sm mb-2">
                  {pet.species}{pet.breed && ` • ${pet.breed}`}
                </p>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                {pet.birthDate && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Baby size={16} />
                    <span>{new Date(pet.birthDate).toLocaleDateString()}</span>
                  </div>
                )}
                {pet.weight && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Weight size={16} />
                    <span>{pet.weight} lbs</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {pet.notes && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Notes</span>
              </div>
              <p className="text-sm text-gray-600">{pet.notes}</p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">{activeMedications.length}</div>
              <div className="text-xs text-gray-500">Active Meds</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{pet.userPets?.length || 0}</div>
              <div className="text-xs text-gray-500">Caregivers</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">{recentLogs.length}</div>
              <div className="text-xs text-gray-500">Recent Logs</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link
            href={`/pets/${pet.id}/medications`}
            className="flex items-center gap-3 bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Pill size={20} />
            <div>
              <div className="font-medium">Medications</div>
              <div className="text-xs opacity-90">{activeMedications.length} active</div>
            </div>
          </Link>
          
          <button
            onClick={() => setShowQr(true)}
            className="flex items-center gap-3 bg-gray-100 text-gray-700 p-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <QrCode size={20} />
            <div>
              <div className="font-medium">QR Code</div>
              <div className="text-xs opacity-75">Share access</div>
            </div>
          </button>
        </div>

        {/* Medications Overview */}
        {activeMedications.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Pill className="text-blue-600" size={20} />
                <h3 className="font-semibold text-gray-900">Current Medications</h3>
              </div>
              <Link
                href={`/pets/${pet.id}/medications/new`}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
              >
                <Plus size={16} />
              </Link>
            </div>
            
            <div className="space-y-3">
              {activeMedications.slice(0, 3).map((med) => (
                <div key={med.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{med.name}</div>
                    {med.dosage && (
                      <div className="text-sm text-gray-600">
                        {med.dosage}{med.unit ? ` ${med.unit}` : ''}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      {med.schedules?.length || 0} schedule{med.schedules?.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {med.logs && med.logs.length > 0 ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle size={16} />
                        <span className="text-xs">
                          {new Date(med.logs[0]!.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-amber-600">
                        <AlertCircle size={16} />
                        <span className="text-xs">No recent doses</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {activeMedications.length > 3 && (
                <Link
                  href={`/pets/${pet.id}/medications`}
                  className="block text-center text-blue-600 text-sm font-medium py-2 hover:text-blue-700"
                >
                  View all {activeMedications.length} medications →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {recentLogs.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="text-green-600" size={20} />
              <h3 className="font-semibold text-gray-900">Recent Activity</h3>
            </div>
            
            <div className="space-y-3">
              {recentLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="bg-green-100 p-1 rounded-full mt-1">
                    <CheckCircle className="text-green-600" size={12} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      Medication dose logged
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      Status: {log.status}
                      {log.actualTime && ` • Given at ${new Date(log.actualTime).toLocaleTimeString()}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString()} 
                      {log.givenBy && ` • by ${log.givenBy.name || log.givenBy.email}`}
                    </div>
                    {log.notes && (
                      <div className="text-xs text-gray-600 mt-1 italic">
                        "{log.notes}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Caregivers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="text-purple-600" size={20} />
              <h3 className="font-semibold text-gray-900">Caregivers</h3>
            </div>
            <button
              onClick={() => setShowAddCaregiver(true)}
              className="p-1 text-purple-600 hover:bg-purple-50 rounded"
            >
              <Plus size={16} />
            </button>
          </div>
          
          <div className="space-y-3">
            {pet.userPets?.map((up) => (
              <div key={up.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <User className="text-purple-600" size={16} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {up.user.name || up.user.email}
                    </div>
                    <div className="text-sm text-gray-600 capitalize">
                      {up.role}
                    </div>
                  </div>
                </div>
                
                {up.role !== "owner" && (
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${up.user.name || up.user.email} as a caregiver?`)) {
                        removeCaregiverMutation.mutate({
                          petId: pet.id,
                          userId: up.userId,
                        });
                      }
                    }}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Actions */}
        <div className="grid grid-cols-2 gap-3 mb-20">
          <Link
            href={`/pets/${pet.id}/schedule`}
            className="flex items-center gap-3 bg-gray-100 text-gray-700 p-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Calendar size={20} />
            <div>
              <div className="font-medium">Schedule</div>
              <div className="text-xs opacity-75">View calendar</div>
            </div>
          </Link>
          
          <button
            onClick={() => setEditingPet(true)}
            className="flex items-center gap-3 bg-gray-100 text-gray-700 p-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Settings size={20} />
            <div>
              <div className="font-medium">Settings</div>
              <div className="text-xs opacity-75">Edit pet info</div>
            </div>
          </button>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQr && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              {pet.name}'s QR Code
            </h3>
            
            <div className="bg-white p-4 rounded-lg text-center mb-4">
              <QRCode
                value={`${window.location.origin}/qr?id=${pet.qrCodeId}`}
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>
            
            <p className="text-sm text-gray-600 text-center mb-4">
              Share this QR code with other caregivers or keep it handy for emergency access
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowQr(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Download QR code logic (same as pets page)
                  const svg = document.querySelector('svg');
                  if (svg) {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const data = new XMLSerializer().serializeToString(svg);
                    const DOMURL = window.URL || window.webkitURL || window;
                    const img = new Image();
                    const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
                    const url = DOMURL.createObjectURL(svgBlob);
                    
                    img.onload = () => {
                      canvas.width = img.width;
                      canvas.height = img.height;
                      ctx?.drawImage(img, 0, 0);
                      DOMURL.revokeObjectURL(url);
                      
                      canvas.toBlob((blob) => {
                        if (blob) {
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${pet.name}-medication-qr.png`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }
                      });
                    };
                    
                    img.src = url;
                  }
                }}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Caregiver Modal */}
      {showAddCaregiver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add Caregiver
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={caregiverEmail}
                onChange={(e) => setCaregiverEmail(e.target.value)}
                placeholder="caregiver@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAddCaregiver(false);
                  setCaregiverEmail("");
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (caregiverEmail.trim()) {
                    addCaregiverMutation.mutate({
                      petId: pet.id,
                      email: caregiverEmail.trim(),
                      role: "caregiver",
                    });
                  }
                }}
                disabled={!caregiverEmail.trim() || addCaregiverMutation.isPending}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {addCaregiverMutation.isPending ? "Adding..." : "Add"}
              </button>
            </div>
            
            {addCaregiverMutation.error && (
              <p className="text-red-600 text-sm mt-2">
                {addCaregiverMutation.error.message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Edit Pet Modal */}
      {editingPet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit {pet.name}
            </h3>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData);
                
                updatePetMutation.mutate({
                  id: pet.id,
                  name: data.name as string,
                  species: data.species as string || undefined,
                  breed: data.breed as string || undefined,
                  birthDate: data.birthDate ? new Date(data.birthDate as string) : undefined,
                  weight: data.weight ? parseFloat(data.weight as string) : undefined,
                  notes: data.notes as string || undefined,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  name="name"
                  type="text"
                  defaultValue={pet.name}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Species
                  </label>
                  <input
                    name="species"
                    type="text"
                    defaultValue={pet.species || ""}
                    placeholder="Dog, Cat, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Breed
                  </label>
                  <input
                    name="breed"
                    type="text"
                    defaultValue={pet.breed || ""}
                    placeholder="Golden Retriever"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birth Date
                  </label>
                  <input
                    name="birthDate"
                    type="date"
                    defaultValue={pet.birthDate ? new Date(pet.birthDate).toISOString().split('T')[0] : ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (lbs)
                  </label>
                  <input
                    name="weight"
                    type="number"
                    step="0.1"
                    min="0"
                    defaultValue={pet.weight || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={pet.notes || ""}
                  placeholder="Any special notes about your pet..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingPet(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatePetMutation.isPending}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {updatePetMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
            
            {updatePetMutation.error && (
              <p className="text-red-600 text-sm mt-2">
                {updatePetMutation.error.message}
              </p>
            )}
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
