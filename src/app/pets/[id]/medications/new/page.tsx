"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import MobileLayout from "@/components/MobileLayout";
import {
  Pill,
  Plus,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const COMMON_MEDICATIONS = [
  { name: "Heartgard Plus", type: "Preventive" },
  { name: "NexGard", type: "Preventive" },
  { name: "Apoquel", type: "Allergy" },
  { name: "Rimadyl", type: "Pain/Inflammation" },
  { name: "Metacam", type: "Pain/Inflammation" },
  { name: "Tramadol", type: "Pain" },
  { name: "Gabapentin", type: "Pain/Seizure" },
  { name: "Prednisone", type: "Anti-inflammatory" },
  { name: "Cephalexin", type: "Antibiotic" },
  { name: "Amoxicillin", type: "Antibiotic" },
];

const FREQUENCY_OPTIONS = [
  "Once daily",
  "Twice daily", 
  "Three times daily",
  "Every 8 hours",
  "Every 12 hours",
  "Once weekly",
  "Once monthly",
  "As needed",
  "Custom",
];

const UNIT_OPTIONS = [
  "mg",
  "ml", 
  "tablets",
  "capsules",
  "drops",
  "cc",
  "units",
];

export default function NewMedicationPage() {
  const params = useParams();
  const router = useRouter();
  const petId = params.id as string;
  
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    unit: "",
    instructions: "",
    frequency: "",
    timeOfDay: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    notes: "",
  });
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [createSchedule, setCreateSchedule] = useState(true);
  
  const { data: pet } = api.pet.getById.useQuery({ id: petId });
  
  const createMedicationMutation = api.medication.create.useMutation({
    onSuccess: (medication) => {
      router.push(`/pets/${petId}/medications`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createMedicationMutation.mutateAsync({
        petId,
        name: formData.name,
        dosage: formData.dosage || undefined,
        unit: formData.unit || undefined,
        instructions: formData.instructions || undefined,
      });
    } catch (error) {
      console.error("Failed to create medication:", error);
    }
  };

  const handleMedicationSelect = (medication: typeof COMMON_MEDICATIONS[0]) => {
    setFormData(prev => ({
      ...prev,
      name: medication.name,
    }));
    setShowSuggestions(false);
  };

  const filteredSuggestions = COMMON_MEDICATIONS.filter(med =>
    med.name.toLowerCase().includes(formData.name.toLowerCase()) ||
    med.type.toLowerCase().includes(formData.name.toLowerCase())
  );

  if (!pet) {
    return (
      <MobileLayout activeTab="pets">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
            <h1 className="text-xl font-bold text-gray-900">Add Medication</h1>
            <p className="text-sm text-gray-600">{pet.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Medication Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medication Name *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                  setShowSuggestions(e.target.value.length > 0);
                }}
                onFocus={() => setShowSuggestions(formData.name.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Enter medication name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredSuggestions.slice(0, 8).map((med, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleMedicationSelect(med)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span className="font-medium">{med.name}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {med.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Start typing to see common medications
            </p>
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

          {/* Schedule Section */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="text-blue-600" size={20} />
                <h3 className="font-semibold text-blue-900">Create Schedule</h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateSchedule(!createSchedule)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  createSchedule
                    ? "bg-blue-600 text-white"
                    : "bg-white text-blue-600 border border-blue-600"
                }`}
              >
                {createSchedule ? "Enabled" : "Disabled"}
              </button>
            </div>
            
            {createSchedule && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Frequency
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select frequency</option>
                    {FREQUENCY_OPTIONS.map(freq => (
                      <option key={freq} value={freq}>{freq}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Time of Day
                    </label>
                    <input
                      type="time"
                      value={formData.timeOfDay}
                      onChange={(e) => setFormData(prev => ({ ...prev, timeOfDay: e.target.value }))}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    min={formData.startDate}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-blue-700 mt-1">
                    Leave empty for ongoing medication
                  </p>
                </div>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Note about schedules</p>
                  <p>
                    You can {createSchedule ? "create a schedule now or " : ""}add schedules later 
                    from the medication details page. Schedules help track doses and send reminders.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes about this medication..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-6 pb-20">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name.trim() || createMedicationMutation.isPending}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMedicationMutation.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Plus size={20} />
                  Add Medication
                </div>
              )}
            </button>
          </div>

          {/* Error Display */}
          {createMedicationMutation.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Failed to create medication
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    {createMedicationMutation.error.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Success Message */}
        {createMedicationMutation.isSuccess && (
          <div className="fixed top-4 left-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 z-50">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              <p className="text-sm font-medium text-green-800">
                Medication added successfully!
              </p>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
