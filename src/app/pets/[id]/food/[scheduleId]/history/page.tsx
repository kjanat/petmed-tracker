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
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface FoodHistoryPageProps {
  params: Promise<{ id: string; scheduleId: string }>;
}

type StatusFilter = "all" | "fed" | "missed" | "skipped";

export default function FoodHistoryPage({ params }: FoodHistoryPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string; scheduleId: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const ITEMS_PER_PAGE = 20;
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

  // Get logs for this schedule (we'll filter on frontend for now)
  const allLogs = schedule?.logs || [];
  
  // Filter logs
  const filteredLogs = allLogs.filter(log => {
    if (statusFilter === "all") return true;
    return log.status === statusFilter;
  });

  // Paginate logs
  const totalLogs = filteredLogs.length;
  const totalPages = Math.ceil(totalLogs / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "fed":
        return {
          icon: <CheckCircle size={16} />,
          color: "text-green-600",
          bg: "bg-green-50",
          label: "Fed"
        };
      case "missed":
        return {
          icon: <XCircle size={16} />,
          color: "text-red-600",
          bg: "bg-red-50",
          label: "Missed"
        };
      case "skipped":
        return {
          icon: <Minus size={16} />,
          color: "text-yellow-600",
          bg: "bg-yellow-50",
          label: "Skipped"
        };
      default:
        return {
          icon: <Clock size={16} />,
          color: "text-blue-600",
          bg: "bg-blue-50",
          label: "Pending"
        };
    }
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusCounts = () => {
    const counts = {
      all: allLogs.length,
      fed: allLogs.filter(log => log.status === "fed").length,
      missed: allLogs.filter(log => log.status === "missed").length,
      skipped: allLogs.filter(log => log.status === "skipped").length,
    };
    
    return counts;
  };

  const statusCounts = getStatusCounts();
  const adherenceRate = statusCounts.all > 0 ? Math.round((statusCounts.fed / statusCounts.all) * 100) : 0;

  const exportToCsv = () => {
    if (filteredLogs.length === 0) {
      toast.error("No logs to export");
      return;
    }

    const headers = ["Date", "Scheduled Time", "Actual Time", "Status", "Fed By", "Notes"];
    const csvContent = [
      headers.join(","),
      ...filteredLogs.map(log => [
        new Date(log.scheduledTime).toLocaleDateString(),
        new Date(log.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        log.actualTime ? new Date(log.actualTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
        log.status,
        log.fedBy?.name || "",
        log.notes?.replace(/,/g, ";") || ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pet?.name || "pet"}-${schedule?.foodType || "food"}-history.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("History exported to CSV");
  };

  if (!resolvedParams?.id || !schedule) {
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
              <h1 className="text-xl font-bold text-gray-900">Feeding History</h1>
              <p className="text-sm text-gray-600">{schedule.foodType} • {pet?.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Filter size={20} />
              </button>
              
              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                  {(["all", "fed", "missed", "skipped"] as StatusFilter[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setCurrentPage(1);
                        setShowFilterMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                        statusFilter === status ? "bg-blue-50 text-blue-600" : ""
                      }`}
                    >
                      <span className="capitalize">{status}</span>
                      <span className="text-xs text-gray-500">
                        {statusCounts[status]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={exportToCsv}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Export to CSV"
            >
              <Download size={20} />
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-blue-900">{adherenceRate}%</div>
              <div className="text-sm text-blue-700">Feeding Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-900">{statusCounts.all}</div>
              <div className="text-sm text-blue-700">Total Logs</div>
            </div>
          </div>
          
          <div className="flex justify-between mt-4 text-sm">
            <div className="flex items-center gap-1">
              <CheckCircle size={14} className="text-green-600" />
              <span className="text-green-700">{statusCounts.fed} Fed</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle size={14} className="text-red-600" />
              <span className="text-red-700">{statusCounts.missed} Missed</span>
            </div>
            <div className="flex items-center gap-1">
              <Minus size={14} className="text-yellow-600" />
              <span className="text-yellow-700">{statusCounts.skipped} Skipped</span>
            </div>
          </div>
        </div>

        {/* Filter Status */}
        {statusFilter !== "all" && (
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">
              Showing {filteredLogs.length} {statusFilter} log{filteredLogs.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => {
                setStatusFilter("all");
                setCurrentPage(1);
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear filter
            </button>
          </div>
        )}

        {/* History List */}
        <div className="space-y-3 mb-6">
          {paginatedLogs.length === 0 ? (
            <div className="text-center py-12">
              <Coffee className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No feeding logs yet
              </h3>
              <p className="text-gray-600">
                {statusFilter === "all" 
                  ? "Start logging feedings to see history here"
                  : `No ${statusFilter} feedings logged yet`
                }
              </p>
            </div>
          ) : (
            paginatedLogs.map((log) => {
              const statusInfo = getStatusInfo(log.status);
              return (
                <div
                  key={log.id}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                        {statusInfo.icon}
                      </div>
                      <div>
                        <div className={`font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDateTime(log.scheduledTime)}
                          {log.actualTime && log.actualTime !== log.scheduledTime && (
                            <span className="ml-2">
                              → {formatDateTime(log.actualTime)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {log.fedBy && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <User size={14} />
                      <span>Fed by {log.fedBy.name}</span>
                    </div>
                  )}
                  
                  {log.notes && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <FileText size={14} className="mt-0.5" />
                      <span>{log.notes}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, totalLogs)} of {totalLogs}
            </span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 text-sm font-medium rounded-lg ${
                        page === currentPage
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="text-gray-500">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className={`w-8 h-8 text-sm font-medium rounded-lg ${
                        totalPages === currentPage
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
