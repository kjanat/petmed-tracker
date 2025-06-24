"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import MobileLayout from "@/components/MobileLayout";
import {
  Pill,
  Save,
  Trash2,
  AlertCircle,
  CheckCircle,
  Settings,
  Archive,
} from "lucide-react";

const UNIT_OPTIONS = [
  "mg",
  "ml", 
  "tablets",
  "capsules",
  "drops",
  "cc",
  "units",
];

export default function EditMedicationPage() {
  const params = useParams();
  const router = useRouter();
  const petId = params.id as string;
  const medicationId = params.medId as string;
  
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    unit: "",
    instructions: "",
    isActive: true,
  });
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: pet } = api.pet.getById.useQuery({ id: petId });
  const { data: medications, refetch: refetchMedications } = api.medication.getByPet.useQuery({ petId });
  
  const medication = medications?.find(m => m.id === medicationId);
  
  const updateMedicationMutation = api.medication.update.useMutation({
    onSuccess: () => {
      refetchMedications();
      router.push(`/pets/${petId}/medications`);
    },
  });

  const deleteMedicationMutation = api.medication.update.useMutation({
    onSuccess: () => {
      refetchMedications();
      router.push(`/pets/${petId}/medications`);
    },
  });

  // Populate form when medication data loads
  useEffect(() => {
    if (medication) {
      setFormData({
        name: medication.name,
        dosage: medication.dosage || "",
        unit: medication.unit || "",
        instructions: medication.instructions || "",
        isActive: medication.isActive,
      });
    }
  }, [medication]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!medication) return;
    
    try {
      await updateMedicationMutation.mutateAsync({
        id: medication.id,
        name: formData.name,
        dosage: formData.dosage || undefined,
        unit: formData.unit || undefined,
        instructions: formData.instructions || undefined,
        isActive: formData.isActive,
      });
    } catch (error) {
      console.error("Failed to update medication:", error);
    }
  };

  const handleDelete = async () => {
    if (!medication) return;
    
    try {
      // Instead of actually deleting, we'll deactivate the medication
      await deleteMedicationMutation.mutateAsync({
        id: medication.id,
        isActive: false,
      });
    } catch (error) {
      console.error("Failed to delete medication:", error);
    }
  };

  if (!pet || !medication) {
    return (
      <MobileLayout activeTab="pets">
        <div className="px-4 py-8 text-center">
          <Pill className="mx-auto mb-4 text-gray-400" size={48} />
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {!pet ? "Pet not found" : "Medication not found"}
          </h2>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout activeTab="pets">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Edit Medication</h1>
            <p className="text-sm text-gray-600">{pet.name}</p>
          </div>
        </div>

        {/* Status Banner */}
        {!medication.isActive && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <Archive size={16} className="text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  This medication is currently inactive
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Activate it to resume tracking and scheduling
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Medication Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medication Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter medication name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Dosage and Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dosage
              </label>
              <input
                type="text"
                value={formData.dosage}
                onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                placeholder="25"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select unit</option>
                {UNIT_OPTIONS.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Give with food, morning dose, etc."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isActive: true }))}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${
                  formData.isActive
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={16} className={formData.isActive ? "text-green-600" : "text-gray-400"} />
                  <span className="font-medium">Active</span>
                </div>
                <div className="text-sm opacity-75">
                  Medication is being tracked and scheduled
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isActive: false }))}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${
                  !formData.isActive
                    ? "bg-gray-50 border-gray-300 text-gray-800"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Archive size={16} className={!formData.isActive ? "text-gray-600" : "text-gray-400"} />
                  <span className="font-medium">Inactive</span>
                </div>
                <div className="text-sm opacity-75">
                  Medication is paused but data is preserved
                </div>
              </button>
            </div>
          </div>

          {/* Recent Activity Summary */}
          {medication.logs && medication.logs.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Recent Activity</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Total doses logged:</span>
                  <span className="font-medium text-blue-900">{medication.logs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Last dose:</span>
                  <span className="font-medium text-blue-900">
                    {medication.logs[0]?.actualTime 
                      ? new Date(medication.logs[0].actualTime).toLocaleDateString()
                      : new Date(medication.logs[0]?.createdAt || '').toLocaleDateString()
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Status:</span>
                  <span className={`font-medium ${
                    medication.logs[0]?.status === 'given' ? 'text-green-600' : 
                    medication.logs[0]?.status === 'missed' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {medication.logs[0]?.status || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name.trim() || updateMedicationMutation.isPending}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMedicationMutation.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Save size={20} />
                  Save Changes
                </div>
              )}
            </button>
          </div>

          {/* Danger Zone */}
          <div className="border-t border-gray-200 pt-6">
            <div className="bg-red-50 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <AlertCircle size={16} />
                Danger Zone
              </h3>
              <p className="text-sm text-red-700 mb-4">
                Deleting this medication will permanently remove all associated schedules and dose logs. This action cannot be undone.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 size={16} />
                Delete Medication
              </button>
            </div>
          </div>

          {/* Error Display */}
          {updateMedicationMutation.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Failed to update medication
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    {updateMedicationMutation.error.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delete {medication.name}?
              </h3>
              
              <p className="text-gray-600 mb-6">
                This will permanently delete this medication and all its associated schedules and dose logs. This action cannot be undone.
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMedicationMutation.isPending}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleteMedicationMutation.isPending ? "Deleting..." : "Delete"}
                </button>
              </div>
              
              {deleteMedicationMutation.error && (
                <p className="text-red-600 text-sm mt-2">
                  {deleteMedicationMutation.error.message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Success Message */}
        {updateMedicationMutation.isSuccess && (
          <div className="fixed top-4 left-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 z-50">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              <p className="text-sm font-medium text-green-800">
                Medication updated successfully!
              </p>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
