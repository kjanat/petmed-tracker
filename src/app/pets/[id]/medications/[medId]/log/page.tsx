"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import MobileLayout from "@/components/MobileLayout";
import {
  Pill,
  Clock,
  Check,
  X,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  FileText,
} from "lucide-react";

export default function LogDosePage() {
  const params = useParams();
  const router = useRouter();
  const petId = params.id as string;
  const medicationId = params.medId as string;
  
  const [formData, setFormData] = useState({
    status: "given" as "given" | "missed" | "skipped",
    actualTime: new Date().toISOString().slice(0, 16), // datetime-local format
    notes: "",
  });

  const { data: pet } = api.pet.getById.useQuery({ id: petId });
  const { data: medications } = api.medication.getByPet.useQuery({ petId });
  
  const medication = medications?.find(m => m.id === medicationId);
  
  const logDoseMutation = api.medication.logDose.useMutation({
    onSuccess: () => {
      router.push(`/pets/${petId}/medications`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!medication) return;
    
    try {
      await logDoseMutation.mutateAsync({
        medicationId: medication.id,
        status: formData.status,
        actualTime: new Date(formData.actualTime),
        notes: formData.notes || undefined,
      });
    } catch (error) {
      console.error("Failed to log dose:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "given":
        return <CheckCircle className="text-green-600" size={20} />;
      case "missed":
        return <X className="text-red-600" size={20} />;
      case "skipped":
        return <AlertCircle className="text-yellow-600" size={20} />;
      default:
        return <Clock className="text-gray-600" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "given":
        return "bg-green-50 border-green-200 text-green-800";
      case "missed":
        return "bg-red-50 border-red-200 text-red-800";
      case "skipped":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
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
            <h1 className="text-xl font-bold text-gray-900">Log Dose</h1>
            <p className="text-sm text-gray-600">{pet.name} • {medication.name}</p>
          </div>
        </div>

        {/* Medication Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Pill className="text-blue-600" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">{medication.name}</h3>
              <div className="space-y-1 text-sm text-gray-600">
                {medication.dosage && (
                  <p>Dosage: {medication.dosage}{medication.unit && ` ${medication.unit}`}</p>
                )}
                {medication.instructions && (
                  <p>Instructions: {medication.instructions}</p>
                )}
              </div>
              
              {/* Recent Logs */}
              {medication.logs && medication.logs.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-700 mb-2">Recent doses:</p>
                  <div className="space-y-1">
                    {medication.logs.slice(0, 2).map((log) => (
                      <div key={log.id} className="flex items-center gap-2 text-xs">
                        {getStatusIcon(log.status)}
                        <span className="text-gray-600">
                          {log.actualTime ? new Date(log.actualTime).toLocaleString() : new Date(log.createdAt).toLocaleString()}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Log Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Status *
            </label>
            <div className="grid grid-cols-1 gap-3">
              {[
                { value: "given", label: "Given", description: "Medication was administered successfully", icon: CheckCircle },
                { value: "missed", label: "Missed", description: "Medication was not given at scheduled time", icon: X },
                { value: "skipped", label: "Skipped", description: "Medication was intentionally not given", icon: AlertCircle },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, status: option.value as any }))}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    formData.status === option.value
                      ? getStatusColor(option.value).replace('bg-', 'bg-').replace('50', '100') + ' border-current'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <option.icon 
                      size={20} 
                      className={formData.status === option.value ? 'text-current' : 'text-gray-400'} 
                    />
                    <div>
                      <div className="font-medium text-gray-900 mb-1">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date/Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.status === "given" ? "Time Given" : "Time of Event"} *
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={formData.actualTime}
                onChange={(e) => setFormData(prev => ({ ...prev, actualTime: e.target.value }))}
                max={new Date().toISOString().slice(0, 16)}
                required
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Cannot be in the future
            </p>
          </div>

          {/* Quick Time Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Select
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Now", minutes: 0 },
                { label: "5 min ago", minutes: -5 },
                { label: "15 min ago", minutes: -15 },
                { label: "30 min ago", minutes: -30 },
                { label: "1 hr ago", minutes: -60 },
                { label: "2 hrs ago", minutes: -120 },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => {
                    const date = new Date();
                    date.setMinutes(date.getMinutes() + option.minutes);
                    setFormData(prev => ({ 
                      ...prev, 
                      actualTime: date.toISOString().slice(0, 16) 
                    }));
                  }}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <div className="relative">
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={
                  formData.status === "given" 
                    ? "Any observations after giving the medication..."
                    : formData.status === "missed"
                    ? "Why was the dose missed..."
                    : "Reason for skipping this dose..."
                }
                rows={3}
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Notes className="absolute left-3 top-3 text-gray-400" size={16} />
            </div>
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
              disabled={logDoseMutation.isPending}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {logDoseMutation.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Logging...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Check size={20} />
                  Log Dose
                </div>
              )}
            </button>
          </div>

          {/* Error Display */}
          {logDoseMutation.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Failed to log dose
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    {logDoseMutation.error.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </MobileLayout>
  );
}
