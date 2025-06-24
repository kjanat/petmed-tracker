"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Calendar, Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "react-hot-toast";

interface SchedulePageProps {
  params: Promise<{ id: string; medId: string }>;
}

interface ScheduleFormData {
  scheduleType: "daily" | "weekly" | "custom";
  times: string[];
  daysOfWeek?: number[];
  startDate?: Date;
  endDate?: Date;
}

export default function MedicationSchedulePage({ params }: SchedulePageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string; medId: string } | null>(null);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormData>({
    scheduleType: "daily",
    times: ["08:00"],
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7], // Default to all days
  });

  const router = useRouter();

  // Resolve params
  React.useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  // Get medication details
  const { data: medications, isLoading: medicationsLoading } = api.medication.getByPet.useQuery(
    { petId: resolvedParams?.id ?? "" },
    { enabled: !!resolvedParams?.id }
  );

  const medication = medications?.find(m => m.id === resolvedParams?.medId);

  // Mutations
  const createScheduleMutation = api.medication.createSchedule.useMutation({
    onSuccess: () => {
      toast.success("Schedule created successfully!");
      setShowAddSchedule(false);
      setScheduleForm({
        scheduleType: "daily",
        times: ["08:00"],
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      });
      void utils.medication.getByPet.invalidate({ petId: resolvedParams?.id ?? "" });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteScheduleMutation = api.medication.deleteSchedule.useMutation({
    onSuccess: () => {
      toast.success("Schedule deleted successfully!");
      void utils.medication.getByPet.invalidate({ petId: resolvedParams?.id ?? "" });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const utils = api.useUtils();

  const handleAddTime = () => {
    setScheduleForm(prev => ({
      ...prev,
      times: [...prev.times, "12:00"]
    }));
  };

  const handleRemoveTime = (index: number) => {
    setScheduleForm(prev => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== index)
    }));
  };

  const handleTimeChange = (index: number, time: string) => {
    setScheduleForm(prev => ({
      ...prev,
      times: prev.times.map((t, i) => i === index ? time : t)
    }));
  };

  const handleDayToggle = (day: number) => {
    setScheduleForm(prev => {
      const days = prev.daysOfWeek ?? [];
      const newDays = days.includes(day) 
        ? days.filter(d => d !== day)
        : [...days, day].sort();
      
      return {
        ...prev,
        daysOfWeek: newDays
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resolvedParams?.medId) return;
    
    if (scheduleForm.times.length === 0) {
      toast.error("Please add at least one time");
      return;
    }

    if (scheduleForm.scheduleType === "weekly" && (!scheduleForm.daysOfWeek || scheduleForm.daysOfWeek.length === 0)) {
      toast.error("Please select at least one day");
      return;
    }

    createScheduleMutation.mutate({
      medicationId: resolvedParams.medId,
      scheduleType: scheduleForm.scheduleType,
      times: scheduleForm.times,
      daysOfWeek: scheduleForm.scheduleType === "daily" ? undefined : scheduleForm.daysOfWeek,
      startDate: scheduleForm.startDate,
      endDate: scheduleForm.endDate,
    });
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (!resolvedParams) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (medicationsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading medication...</p>
        </div>
      </div>
    );
  }

  if (!medication) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-red-800">Medication Not Found</h2>
            <p className="text-red-600">The medication you're looking for doesn't exist.</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">Medication Schedule</h1>
              <p className="text-sm text-gray-600">{medication.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Current Schedules */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Current Schedules</h2>
            <button
              onClick={() => setShowAddSchedule(true)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {medication.schedules.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No schedules created yet</p>
              <button
                onClick={() => setShowAddSchedule(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Schedule
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {medication.schedules.map((schedule) => {
                const times = JSON.parse(schedule.times) as string[];
                const daysOfWeek = schedule.daysOfWeek ? JSON.parse(schedule.daysOfWeek) as number[] : null;
                
                return (
                  <div key={schedule.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900 capitalize">
                            {schedule.scheduleType} Schedule
                          </span>
                          {!schedule.isActive && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>
                            <strong>Times:</strong> {times.join(", ")}
                          </div>
                          
                          {daysOfWeek && (
                            <div>
                              <strong>Days:</strong> {daysOfWeek.map(d => dayNames[d]).join(", ")}
                            </div>
                          )}
                          
                          {schedule.startDate && (
                            <div>
                              <strong>Start:</strong> {schedule.startDate.toLocaleDateString()}
                            </div>
                          )}
                          
                          {schedule.endDate && (
                            <div>
                              <strong>End:</strong> {schedule.endDate.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingSchedule(schedule.id)}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            deleteScheduleMutation.mutate({ id: schedule.id });
                          }}
                          disabled={deleteScheduleMutation.isPending}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Schedule Form */}
        {showAddSchedule && (
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Schedule</h3>
              <button
                onClick={() => setShowAddSchedule(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Schedule Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Type
                </label>
                <select
                  value={scheduleForm.scheduleType}
                  onChange={(e) => setScheduleForm(prev => ({ 
                    ...prev, 
                    scheduleType: e.target.value as "daily" | "weekly" | "custom" 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Times */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Times
                  </label>
                  <button
                    type="button"
                    onClick={handleAddTime}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add Time
                  </button>
                </div>
                <div className="space-y-2">
                  {scheduleForm.times.map((time, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => handleTimeChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {scheduleForm.times.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTime(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Days of Week (for weekly/custom) */}
              {(scheduleForm.scheduleType === "weekly" || scheduleForm.scheduleType === "custom") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Days of Week
                  </label>
                  <div className="grid grid-cols-7 gap-1">
                    {dayNames.map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleDayToggle(index)}
                        className={`
                          px-2 py-1 text-xs rounded font-medium transition-colors
                          ${(scheduleForm.daysOfWeek ?? []).includes(index)
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }
                        `}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date Range (for custom) */}
              {scheduleForm.scheduleType === "custom" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={scheduleForm.startDate?.toISOString().split('T')[0] ?? ""}
                      onChange={(e) => setScheduleForm(prev => ({
                        ...prev,
                        startDate: e.target.value ? new Date(e.target.value) : undefined
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={scheduleForm.endDate?.toISOString().split('T')[0] ?? ""}
                      onChange={(e) => setScheduleForm(prev => ({
                        ...prev,
                        endDate: e.target.value ? new Date(e.target.value) : undefined
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddSchedule(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createScheduleMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {createScheduleMutation.isPending ? "Creating..." : "Create Schedule"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Schedule Tips */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Schedule Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Daily schedules repeat every day at the specified times</li>
            <li>• Weekly schedules repeat on selected days each week</li>
            <li>• Custom schedules allow date ranges and specific days</li>
            <li>• You can have multiple active schedules for one medication</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
