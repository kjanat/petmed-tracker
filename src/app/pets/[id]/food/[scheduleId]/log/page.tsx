"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import MobileLayout from "@/components/MobileLayout";
import {
  ArrowLeft,
  Coffee,
  Clock,
  Calendar,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Minus,
  AlertCircle,
  Save,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface LogFeedingPageProps {
  params: Promise<{ id: string; scheduleId: string }>;
}

export default function LogFeedingPage({ params }: LogFeedingPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string; scheduleId: string } | null>(null);
  const [formData, setFormData] = useState({
    status: "fed" as "fed" | "missed" | "skipped",
    actualTime: "",
    notes: "",
  });
  const router = useRouter();

  // Resolve params
  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const { data: pet } = api.pet.getById.useQuery(
    { id: resolvedParams?.id ?? "" },
    { enabled: !!resolvedParams?.id }
  );

  const { data: foodSchedules = [] } = api.food.getByPet.useQuery(
    { petId: resolvedParams?.id ?? "" },
    { enabled: !!resolvedParams?.id }
  );

  const schedule = foodSchedules.find(s => s.id === resolvedParams?.scheduleId);

  // Initialize with current time
  useEffect(() => {
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);
    setFormData(prev => ({
      ...prev,
      actualTime: timeString,
    }));
  }, []);

  const logFeedingMutation = api.food.logFeeding.useMutation({
    onSuccess: () => {
      toast.success("Feeding logged successfully!");
      router.push(`/pets/${resolvedParams?.id}/food`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resolvedParams?.scheduleId) return;
    
    // Validation
    if (!formData.actualTime) {
      toast.error("Please select a time");
      return;
    }
    
    // Parse time and create Date object
    const [hours, minutes] = formData.actualTime.split(':').map(Number);
    if (hours === undefined || minutes === undefined) {
      toast.error("Invalid time format");
      return;
    }
    
    const actualTime = new Date();
    actualTime.setHours(hours, minutes, 0, 0);
    
    logFeedingMutation.mutate({
      scheduleId: resolvedParams.scheduleId,
      status: formData.status,
      actualTime,
      notes: formData.notes.trim() || undefined,
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "fed":
        return {
          icon: <CheckCircle size={20} />,
          color: "text-green-600",
          bg: "bg-green-50",
          border: "border-green-200",
          label: "Fed",
          description: "Pet was fed as scheduled"
        };
      case "missed":
        return {
          icon: <XCircle size={20} />,
          color: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-200",
          label: "Missed",
          description: "Feeding was missed or forgotten"
        };
      case "skipped":
        return {
          icon: <Minus size={20} />,
          color: "text-yellow-600",
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          label: "Skipped",
          description: "Intentionally skipped feeding"
        };
      default:
        return {
          icon: <Clock size={20} />,
          color: "text-blue-600",
          bg: "bg-blue-50",
          border: "border-blue-200",
          label: "Pending",
          description: "Waiting to be fed"
        };
    }
  };

  if (!resolvedParams?.id || !schedule) {
    return (
      <MobileLayout>
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="p-4 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Log Feeding</h1>
            <p className="text-sm text-gray-600">{pet?.name || "Pet"}</p>
          </div>
        </div>

        {/* Schedule Info */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Coffee className="text-blue-600" size={20} />
            <h3 className="font-semibold text-blue-900">{schedule.foodType}</h3>
            {schedule.amount && (
              <span className="text-sm text-blue-700">
                ({schedule.amount}{schedule.unit ? ` ${schedule.unit}` : ''})
              </span>
            )}
          </div>
          
          {/* Feeding Times */}
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Clock size={16} />
            <span>
              {(() => {
                try {
                  const times = JSON.parse(schedule.times) as string[];
                  return times.map(time => {
                    const [hours, minutes] = time.split(':');
                    if (!hours || !minutes) return time;
                    const hour = parseInt(hours);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const displayHour = hour % 12 || 12;
                    return `${displayHour}:${minutes} ${ampm}`;
                  }).join(', ');
                } catch {
                  return "Invalid schedule";
                }
              })()}
            </span>
          </div>
          
          {schedule.instructions && (
            <p className="text-sm text-blue-700 mt-2">
              {schedule.instructions}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Feeding Status *
            </label>
            <div className="space-y-3">
              {(["fed", "missed", "skipped"] as const).map((status) => {
                const statusInfo = getStatusInfo(status);
                return (
                  <label
                    key={status}
                    className={`flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer transition-all ${
                      formData.status === status
                        ? `${statusInfo.border} ${statusInfo.bg}`
                        : "hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={status}
                      checked={formData.status === status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as typeof prev.status }))}
                      className="sr-only"
                    />
                    <div className={formData.status === status ? statusInfo.color : "text-gray-500"}>
                      {statusInfo.icon}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${formData.status === status ? statusInfo.color : "text-gray-900"}`}>
                        {statusInfo.label}
                      </div>
                      <div className="text-sm text-gray-600">
                        {statusInfo.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Actual Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="time"
                value={formData.actualTime}
                onChange={(e) => setFormData(prev => ({ ...prev, actualTime: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400" size={16} />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes about this feeding..."
                rows={3}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={logFeedingMutation.isPending}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {logFeedingMutation.isPending ? (
                "Logging..."
              ) : (
                <>
                  <Save size={16} />
                  Log Feeding
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {logFeedingMutation.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Failed to log feeding
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    {logFeedingMutation.error.message}
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
