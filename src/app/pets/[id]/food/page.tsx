"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import MobileLayout from "@/components/MobileLayout";
import {
  ArrowLeft,
  Plus,
  Coffee,
  Clock,
  Calendar,
  Edit,
  History,
  LogIn,
  MoreVertical,
  CheckCircle,
  XCircle,
  Minus,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface FoodSchedulePageProps {
  params: Promise<{ id: string }>;
}

export default function FoodSchedulePage({ params }: FoodSchedulePageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const router = useRouter();

  // Resolve params
  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const { data: pet } = api.pet.getById.useQuery(
    { id: resolvedParams?.id ?? "" },
    { enabled: !!resolvedParams?.id }
  );

  const { data: foodSchedules = [], refetch } = api.food.getByPet.useQuery(
    { petId: resolvedParams?.id ?? "" },
    { enabled: !!resolvedParams?.id }
  );

  const { data: todaySchedule = [] } = api.food.getTodaySchedule.useQuery(
    { petId: resolvedParams?.id ?? "" },
    { enabled: !!resolvedParams?.id }
  );

  const logFeedingMutation = api.food.logFeeding.useMutation({
    onSuccess: () => {
      toast.success("Feeding logged successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    if (!hours || !minutes) return timeString;
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatTimes = (timesJson: string) => {
    try {
      const times = JSON.parse(timesJson) as string[];
      return times.map(formatTime).join(', ');
    } catch {
      return "Invalid schedule";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "fed":
        return "text-green-600 bg-green-50";
      case "missed":
        return "text-red-600 bg-red-50";
      case "skipped":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "fed":
        return <CheckCircle size={16} />;
      case "missed":
        return <XCircle size={16} />;
      case "skipped":
        return <Minus size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const handleQuickLog = (scheduleId: string, status: "fed" | "missed" | "skipped") => {
    logFeedingMutation.mutate({
      scheduleId,
      status,
      actualTime: new Date(),
    });
  };

  if (!resolvedParams?.id) {
    return (
      <MobileLayout>
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Food Schedules</h1>
              <p className="text-sm text-gray-600">{pet?.name || "Pet"}</p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/pets/${resolvedParams.id}/food/new`)}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Today's Schedule Summary */}
        {todaySchedule.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Today's Feeding Schedule</h2>
            <div className="space-y-2">
              {todaySchedule.map((item, index) => (
                <div
                  key={`${item.scheduleId}-${index}`}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {item.foodType} {item.amount && `(${item.amount}${item.unit ? ` ${item.unit}` : ''})`}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatTime(item.scheduledTime.toTimeString().slice(0, 5))}
                          {item.fedBy && (
                            <span className="ml-2">• Fed by {item.fedBy.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {item.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleQuickLog(item.scheduleId, "fed")}
                          disabled={logFeedingMutation.isPending}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          Fed
                        </button>
                        <button
                          onClick={() => handleQuickLog(item.scheduleId, "missed")}
                          disabled={logFeedingMutation.isPending}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          Missed
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Food Schedules */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">All Food Schedules</h2>
          
          {foodSchedules.length === 0 ? (
            <div className="text-center py-12">
              <Coffee className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No food schedules yet</h3>
              <p className="text-gray-600 mb-6">
                Create a feeding schedule to help track your pet's meals
              </p>
              <button
                onClick={() => router.push(`/pets/${resolvedParams.id}/food/new`)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Schedule
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {foodSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Coffee className="text-blue-600" size={20} />
                        <h3 className="font-semibold text-gray-900">
                          {schedule.foodType}
                        </h3>
                        {schedule.amount && (
                          <span className="text-sm text-gray-600">
                            ({schedule.amount}{schedule.unit ? ` ${schedule.unit}` : ''})
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Clock size={16} />
                        <span>{formatTimes(schedule.times)}</span>
                      </div>
                      
                      {schedule.instructions && (
                        <p className="text-sm text-gray-600 mb-3">
                          {schedule.instructions}
                        </p>
                      )}
                      
                      {/* Recent Logs */}
                      {schedule.logs && schedule.logs.length > 0 && (
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Recent: {schedule.logs[0]?.status || "No logs"}</span>
                          {schedule.logs[0]?.actualTime && (
                            <span>
                              {new Date(schedule.logs[0].actualTime).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === schedule.id ? null : schedule.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      {activeMenu === schedule.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
                          <button
                            onClick={() => {
                              router.push(`/pets/${resolvedParams.id}/food/${schedule.id}/log`);
                              setActiveMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <LogIn size={16} />
                            Log Feeding
                          </button>
                          <button
                            onClick={() => {
                              router.push(`/pets/${resolvedParams.id}/food/${schedule.id}/edit`);
                              setActiveMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Edit size={16} />
                            Edit Schedule
                          </button>
                          <button
                            onClick={() => {
                              router.push(`/pets/${resolvedParams.id}/food/${schedule.id}/history`);
                              setActiveMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <History size={16} />
                            View History
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
