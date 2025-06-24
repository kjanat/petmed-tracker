"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/trpc/react";
import MobileLayout from "@/components/MobileLayout";
import { Clock, AlertCircle, CheckCircle, Download, Heart, Plus, Check, X, FileText } from "lucide-react";
import { toast } from "react-hot-toast";
import QRCode from "react-qr-code";

function QRPageContent() {
  const searchParams = useSearchParams();
  const qrCodeId = searchParams.get("id");
  const [selectedMedication, setSelectedMedication] = useState<string | null>(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const [logForm, setLogForm] = useState({
    status: "given" as "given" | "missed" | "skipped",
    caregiverName: "",
    notes: "",
  });
  
  const { data: scheduleData, isLoading, refetch } = api.qrCode.getTodayScheduleByQrCode.useQuery(
    { qrCodeId: qrCodeId! },
    {
      enabled: !!qrCodeId,
      refetchInterval: 30000,
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const logDoseMutation = api.qrCode.logDoseByQrCode.useMutation({
    onSuccess: () => {
      toast.success("Dose logged successfully!");
      setShowLogForm(false);
      setSelectedMedication(null);
      setLogForm({ status: "given", caregiverName: "", notes: "" });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleQuickLog = (medicationId: string, medicationName: string) => {
    setSelectedMedication(medicationId);
    setShowLogForm(true);
  };

  const handleSubmitLog = () => {
    if (!selectedMedication || !qrCodeId || !logForm.caregiverName.trim()) {
      toast.error("Please fill in your name");
      return;
    }

    logDoseMutation.mutate({
      qrCodeId,
      medicationId: selectedMedication,
      status: logForm.status,
      caregiverName: logForm.caregiverName.trim(),
      notes: logForm.notes,
    });
  };

  if (!qrCodeId) {
    return (
      <MobileLayout activeTab="qr">
        <div className="px-4 py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Invalid QR Code</h2>
            <p className="text-gray-600">
              This QR code link is not valid. Please scan a valid pet medication QR code.
            </p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (isLoading) {
    return (
      <MobileLayout activeTab="qr">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </MobileLayout>
    );
  }

  if (!scheduleData) {
    return (
      <MobileLayout activeTab="qr">
        <div className="px-4 py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pet Not Found</h2>
            <p className="text-gray-600">
              No pet found with this QR code. The QR code may be outdated or invalid.
            </p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  const { pet, schedule } = scheduleData;
  
  // Get current time for status determination
  const now = new Date();
  
  // Calculate status summary
  const totalMeds = schedule.length;
  const givenMeds = schedule.filter(item => item.status === "given").length;
  const pendingMeds = schedule.filter(item => item.status === "pending").length;
  const overdueMeds = schedule.filter(item => 
    item.status === "pending" && new Date(item.scheduledTime) < now
  ).length;

  return (
    <MobileLayout activeTab="qr">
      <div className="px-4 py-6">
        {/* Pet Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <Heart className="text-blue-600 mr-2" size={24} />
            <h1 className="text-2xl font-bold text-gray-900">{pet.name}</h1>
          </div>
          
          {pet.species && (
            <p className="text-gray-600 mb-4">
              {pet.species}{pet.breed && ` • ${pet.breed}`}
            </p>
          )}

          {/* Status Summary */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{givenMeds}</div>
              <div className="text-xs text-gray-600">Given</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{pendingMeds}</div>
              <div className="text-xs text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{overdueMeds}</div>
              <div className="text-xs text-gray-600">Overdue</div>
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Today's Medication Schedule
          </h2>
          
          {schedule.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No medications scheduled for today
            </p>
          ) : (
            <div className="space-y-4">
              {schedule.map((item, index) => {
                const scheduledTime = new Date(item.scheduledTime);
                const isOverdue = item.status === "pending" && scheduledTime < now;
                
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      item.status === "given"
                        ? "border-green-200 bg-green-50"
                        : isOverdue
                        ? "border-red-200 bg-red-50"
                        : "border-orange-200 bg-orange-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {item.status === "given" ? (
                            <CheckCircle size={20} className="text-green-600" />
                          ) : isOverdue ? (
                            <AlertCircle size={20} className="text-red-600" />
                          ) : (
                            <Clock size={20} className="text-orange-600" />
                          )}
                          <h3 className="font-semibold text-gray-900">
                            {item.medicationName}
                          </h3>
                        </div>
                        
                        <div className="text-sm text-gray-700">
                          <div className="font-medium">
                            Scheduled: {scheduledTime.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </div>
                          
                          {item.dosage && (
                            <div>
                              Dosage: {item.dosage}{item.unit ? ` ${item.unit}` : ''}
                            </div>
                          )}
                          
                          {item.instructions && (
                            <div className="mt-1 text-gray-600">
                              {item.instructions}
                            </div>
                          )}
                        </div>

                        {item.status === "given" && item.givenBy && item.actualTime && (
                          <div className="mt-2 text-sm text-green-700">
                            ✓ Given by {item.givenBy.name} at{' '}
                            {new Date(item.actualTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </div>
                        )}
                      </div>

                      <div className="ml-4 space-y-2">
                        {item.status === "given" ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Complete
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Pending
                          </span>
                        )}

                        {/* Quick Log Button */}
                        {item.status !== "given" && (
                          <button
                            onClick={() => handleQuickLog(item.medicationId, item.medicationName)}
                            className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <Plus size={16} />
                            Log Dose
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Emergency Contact Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Emergency Access</h3>
          <p className="text-sm text-blue-800">
            This QR code provides access to {pet.name}'s medication schedule.
            Emergency caregivers can log doses directly from this page.
          </p>
        </div>

        {/* Log Dose Modal */}
        {showLogForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Log Medication Dose
              </h3>
              
              <div className="space-y-4">
                {/* Status Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: "given", label: "Given", icon: CheckCircle, color: "green" },
                      { value: "missed", label: "Missed", icon: X, color: "red" },
                      { value: "skipped", label: "Skipped", icon: AlertCircle, color: "yellow" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setLogForm(prev => ({ ...prev, status: option.value as any }))}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                          logForm.status === option.value
                            ? `border-${option.color}-500 bg-${option.color}-50`
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <option.icon size={20} className={`${
                            logForm.status === option.value ? `text-${option.color}-600` : "text-gray-400"
                          }`} />
                          <span className="font-medium">{option.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Caregiver Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={logForm.caregiverName}
                    onChange={(e) => setLogForm(prev => ({ ...prev, caregiverName: e.target.value }))}
                    placeholder="Enter your name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <div className="relative">
                    <textarea
                      value={logForm.notes}
                      onChange={(e) => setLogForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any observations or notes..."
                      rows={3}
                      className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <FileText className="absolute left-3 top-3 text-gray-400" size={16} />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowLogForm(false);
                      setSelectedMedication(null);
                      setLogForm({ status: "given", caregiverName: "", notes: "" });
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitLog}
                    disabled={logDoseMutation.isPending || !logForm.caregiverName.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {logDoseMutation.isPending ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Logging...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Check size={16} />
                        Log Dose
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Notice */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            This page automatically refreshes every 30 seconds
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}

export default function QRPage() {
  return (
    <Suspense fallback={
      <MobileLayout activeTab="qr">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </MobileLayout>
    }>
      <QRPageContent />
    </Suspense>
  );
}
