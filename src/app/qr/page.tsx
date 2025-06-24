"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/trpc/react";
import MobileLayout from "@/components/MobileLayout";
import { Clock, AlertCircle, CheckCircle, Download, Heart } from "lucide-react";
import QRCode from "react-qr-code";

function QRPageContent() {
  const searchParams = useSearchParams();
  const qrCodeId = searchParams.get("id");
  
  const { data: scheduleData, isLoading } = api.qrCode.getTodayScheduleByQrCode.useQuery(
    { qrCodeId: qrCodeId! },
    {
      enabled: !!qrCodeId,
      refetchInterval: 30000,
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

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

                      <div className="ml-4">
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
            This QR code provides read-only access to {pet.name}'s medication schedule.
            For emergencies or to log medications, please contact one of the pet's caregivers.
          </p>
        </div>

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
