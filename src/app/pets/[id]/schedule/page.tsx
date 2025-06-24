"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Pill, 
  Check, 
  X, 
  AlertCircle,
  Filter,
  Download
} from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "react-hot-toast";

interface SchedulePageProps {
  params: Promise<{ id: string }>;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  medications: MedicationScheduleItem[];
}

interface MedicationScheduleItem {
  medicationId: string;
  medicationName: string;
  dosage?: string;
  unit?: string;
  instructions?: string;
  scheduledTime: Date;
  status: "pending" | "given" | "missed" | "skipped";
  givenBy?: { name: string | null; email: string | null };
  actualTime?: Date;
  notes?: string;
  logId?: string;
}

export default function PetSchedulePage({ params }: SchedulePageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const router = useRouter();

  // Resolve params
  React.useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  // Get pet details
  const { data: pet, isLoading: petLoading } = api.pet.getById.useQuery(
    { id: resolvedParams?.id ?? "" },
    { enabled: !!resolvedParams?.id }
  );

  // Get today's schedule (we'll expand this to get monthly schedule)
  const { data: todaySchedule, isLoading: scheduleLoading } = api.medication.getTodaySchedule.useQuery(
    { petId: resolvedParams?.id ?? "" },
    { enabled: !!resolvedParams?.id }
  );

  // Log dose mutation
  const logDoseMutation = api.medication.logDose.useMutation({
    onSuccess: () => {
      toast.success("Dose logged successfully!");
      void utils.medication.getTodaySchedule.invalidate({ petId: resolvedParams?.id ?? "" });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const utils = api.useUtils();

  // Calendar generation
  const generateCalendar = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const calendar: CalendarDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = 
        currentDate.getDate() === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear();
      
      // For now, only show today's medications
      // In a real app, you'd fetch medications for each day
      const medications: MedicationScheduleItem[] = isToday
        ? (todaySchedule ?? []).map(item => ({
            medicationId: item.medicationId,
            medicationName: item.medicationName,
            dosage: item.dosage || undefined,
            unit: item.unit || undefined,
            instructions: item.instructions || undefined,
            scheduledTime: item.scheduledTime,
            status: item.status as "pending" | "given" | "missed" | "skipped",
            givenBy: item.givenBy ? {
              name: item.givenBy.name,
              email: item.givenBy.email
            } : undefined,
            actualTime: item.actualTime || undefined,
            notes: item.notes || undefined,
            logId: item.logId || undefined,
          }))
        : [];
      
      calendar.push({
        date: currentDate,
        isCurrentMonth,
        isToday,
        medications,
      });
    }
    
    return calendar;
  };

  const calendar = generateCalendar(currentDate);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleLogDose = (medicationId: string, status: "given" | "missed" | "skipped") => {
    if (!resolvedParams?.id) return;
    
    logDoseMutation.mutate({
      medicationId,
      status,
      actualTime: new Date(),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "given": return "bg-green-100 text-green-800";
      case "missed": return "bg-red-100 text-red-800";
      case "skipped": return "bg-yellow-100 text-yellow-800";
      case "pending": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "given": return <Check className="h-3 w-3" />;
      case "missed": return <X className="h-3 w-3" />;
      case "skipped": return <X className="h-3 w-3" />;
      case "pending": return <Clock className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const filteredSchedule = selectedDate 
    ? calendar.find(day => 
        day.date.getDate() === selectedDate.getDate() &&
        day.date.getMonth() === selectedDate.getMonth() &&
        day.date.getFullYear() === selectedDate.getFullYear()
      )?.medications.filter(med => 
        statusFilter === "all" || med.status === statusFilter
      ) ?? []
    : [];

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

  if (petLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pet...</p>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-red-800">Pet Not Found</h2>
            <p className="text-red-600">The pet you're looking for doesn't exist.</p>
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
              <h1 className="text-lg font-semibold text-gray-900">Schedule Calendar</h1>
              <p className="text-sm text-gray-600">{pet.name}</p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Filter className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium text-gray-900 mb-3">Filters</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="given">Given</option>
                <option value="missed">Missed</option>
                <option value="skipped">Skipped</option>
              </select>
            </div>
          </div>
        )}

        {/* Calendar */}
        <div className="bg-white rounded-lg border">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth("next")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendar.map((day, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day.date)}
                  className={`
                    relative aspect-square text-sm transition-colors rounded-lg
                    ${day.isCurrentMonth 
                      ? "text-gray-900 hover:bg-gray-100" 
                      : "text-gray-400"
                    }
                    ${day.isToday 
                      ? "bg-blue-100 text-blue-900 font-semibold" 
                      : ""
                    }
                    ${selectedDate && 
                      selectedDate.getDate() === day.date.getDate() &&
                      selectedDate.getMonth() === day.date.getMonth() &&
                      selectedDate.getFullYear() === day.date.getFullYear()
                        ? "ring-2 ring-blue-500 bg-blue-50" 
                        : ""
                    }
                  `}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span>{day.date.getDate()}</span>
                    {day.medications.length > 0 && (
                      <div className="flex gap-px mt-1">
                        {day.medications.slice(0, 3).map((med, medIndex) => (
                          <div
                            key={medIndex}
                            className={`w-1 h-1 rounded-full ${
                              med.status === "given" ? "bg-green-500" :
                              med.status === "missed" ? "bg-red-500" :
                              med.status === "skipped" ? "bg-yellow-500" :
                              "bg-blue-500"
                            }`}
                          />
                        ))}
                        {day.medications.length > 3 && (
                          <div className="w-1 h-1 rounded-full bg-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Day Details */}
        {selectedDate && (
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">
                {selectedDate.toLocaleDateString("en-US", { 
                  weekday: "long", 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })}
              </h3>
              <p className="text-sm text-gray-600">
                {filteredSchedule.length} medication{filteredSchedule.length !== 1 ? "s" : ""} scheduled
              </p>
            </div>

            <div className="p-4">
              {filteredSchedule.length === 0 ? (
                <div className="text-center py-6">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No medications scheduled for this day</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSchedule.map((medication, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Pill className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {medication.medicationName}
                            </span>
                            <span className={`
                              px-2 py-1 text-xs rounded-full flex items-center gap-1
                              ${getStatusColor(medication.status)}
                            `}>
                              {getStatusIcon(medication.status)}
                              {medication.status}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                Scheduled: {medication.scheduledTime.toLocaleTimeString("en-US", { 
                                  hour: "numeric", 
                                  minute: "2-digit" 
                                })}
                              </span>
                            </div>
                            
                            {medication.dosage && (
                              <div>
                                <strong>Dosage:</strong> {medication.dosage} {medication.unit}
                              </div>
                            )}
                            
                            {medication.givenBy && (
                              <div>
                                <strong>Given by:</strong> {medication.givenBy.name || medication.givenBy.email}
                              </div>
                            )}
                            
                            {medication.actualTime && (
                              <div>
                                <strong>Actual time:</strong> {medication.actualTime.toLocaleTimeString("en-US", { 
                                  hour: "numeric", 
                                  minute: "2-digit" 
                                })}
                              </div>
                            )}
                            
                            {medication.notes && (
                              <div>
                                <strong>Notes:</strong> {medication.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      {medication.status === "pending" && (
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          <button
                            onClick={() => handleLogDose(medication.medicationId, "given")}
                            disabled={logDoseMutation.isPending}
                            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            Mark Given
                          </button>
                          <button
                            onClick={() => handleLogDose(medication.medicationId, "missed")}
                            disabled={logDoseMutation.isPending}
                            className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            Mark Missed
                          </button>
                          <button
                            onClick={() => handleLogDose(medication.medicationId, "skipped")}
                            disabled={logDoseMutation.isPending}
                            className="flex-1 px-3 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                          >
                            Skip
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Today's Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(todaySchedule ?? []).filter(s => s.status === "given").length}
              </div>
              <div className="text-sm text-gray-600">Given</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {(todaySchedule ?? []).filter(s => s.status === "pending").length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={() => toast.success("Export functionality coming soon!")}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export Schedule
        </button>
      </div>
    </div>
  );
}
