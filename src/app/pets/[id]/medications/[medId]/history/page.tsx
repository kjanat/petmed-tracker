"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import MobileLayout from "@/components/MobileLayout";
import {
  Pill,
  Calendar,
  Clock,
  CheckCircle,
  X,
  AlertCircle,
  Filter,
  Download,
  User,
  FileText,
  TrendingUp,
  Activity,
} from "lucide-react";

const STATUS_COLORS = {
  given: "bg-green-50 border-green-200 text-green-800",
  missed: "bg-red-50 border-red-200 text-red-800",
  skipped: "bg-yellow-50 border-yellow-200 text-yellow-800",
  pending: "bg-gray-50 border-gray-200 text-gray-800",
};

const STATUS_ICONS = {
  given: CheckCircle,
  missed: X,
  skipped: AlertCircle,
  pending: Clock,
};

export default function MedicationHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const petId = params.id as string;
  const medicationId = params.medId as string;
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30"); // days
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;

  const { data: pet } = api.pet.getById.useQuery({ id: petId });
  const { data: medications } = api.medication.getByPet.useQuery({ petId });
  
  const medication = medications?.find(m => m.id === medicationId);

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

  // Filter logs based on status and date range
  const filteredLogs = medication.logs?.filter(log => {
    // Status filter
    if (statusFilter !== "all" && log.status !== statusFilter) return false;
    
    // Date range filter
    if (dateRange !== "all") {
      const dayLimit = parseInt(dateRange);
      const logDate = new Date(log.createdAt);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - dayLimit);
      if (logDate < cutoffDate) return false;
    }
    
    return true;
  }) || [];

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  // Calculate statistics
  const stats = {
    total: medication.logs?.length || 0,
    given: medication.logs?.filter(l => l.status === "given").length || 0,
    missed: medication.logs?.filter(l => l.status === "missed").length || 0,
    skipped: medication.logs?.filter(l => l.status === "skipped").length || 0,
  };

  const adherenceRate = stats.total > 0 ? Math.round((stats.given / stats.total) * 100) : 0;

  const exportData = () => {
    const csvContent = [
      ["Date", "Time", "Status", "Given By", "Notes"].join(","),
      ...filteredLogs.map(log => [
        new Date(log.actualTime || log.createdAt).toLocaleDateString(),
        new Date(log.actualTime || log.createdAt).toLocaleTimeString(),
        log.status,
        log.givenBy?.name || log.givenBy?.email || "Unknown",
        `"${log.notes || ""}"`,
      ].join(","))
    ].join("\\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pet.name}-${medication.name}-history.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Medication History</h1>
            <p className="text-sm text-gray-600">{pet.name} • {medication.name}</p>
          </div>
          <button
            onClick={exportData}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Download size={20} />
          </button>
        </div>

        {/* Medication Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Pill className="text-blue-600" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">{medication.name}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                {medication.dosage && (
                  <div>
                    <span className="font-medium">Dosage:</span> {medication.dosage}
                    {medication.unit && ` ${medication.unit}`}
                  </div>
                )}
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <span className={medication.isActive ? "text-green-600" : "text-gray-500"}>
                    {medication.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              {medication.instructions && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">Instructions:</span> {medication.instructions}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-blue-600" size={16} />
              <span className="text-sm font-medium text-gray-700">Adherence Rate</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">{adherenceRate}%</div>
            <div className="text-xs text-gray-500">{stats.given} of {stats.total} doses</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="text-green-600" size={16} />
              <span className="text-sm font-medium text-gray-700">Total Logged</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mb-1">{stats.total}</div>
            <div className="text-xs text-gray-500">
              {stats.missed} missed • {stats.skipped} skipped
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="text-gray-500" size={16} />
            <span className="font-medium text-gray-700">Filters</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="given">Given</option>
                <option value="missed">Missed</option>
                <option value="skipped">Skipped</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Period
              </label>
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
                <option value="365">Last year</option>
              </select>
            </div>
          </div>
          
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredLogs.length} of {medication.logs?.length || 0} total entries
          </div>
        </div>

        {/* History List */}
        <div className="space-y-3 mb-6">
          {paginatedLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No logs found</h3>
              <p className="text-gray-600">
                {statusFilter !== "all" || dateRange !== "all" 
                  ? "Try adjusting your filters to see more results."
                  : "No doses have been logged for this medication yet."
                }
              </p>
            </div>
          ) : (
            paginatedLogs.map((log) => {
              const StatusIcon = STATUS_ICONS[log.status as keyof typeof STATUS_ICONS];
              const statusColor = STATUS_COLORS[log.status as keyof typeof STATUS_COLORS];
              
              return (
                <div key={log.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${statusColor}`}>
                      <StatusIcon size={16} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                          {log.status}
                        </span>
                        <div className="text-sm text-gray-500">
                          {log.actualTime ? new Date(log.actualTime).toLocaleDateString() : new Date(log.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock size={14} />
                          <span>
                            {log.actualTime ? new Date(log.actualTime).toLocaleTimeString() : new Date(log.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        {log.givenBy && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <User size={14} />
                            <span>{log.givenBy.name || log.givenBy.email}</span>
                          </div>
                        )}
                        
                        {log.notes && (
                          <div className="bg-gray-50 rounded-lg p-2 mt-2">
                            <div className="flex items-start gap-2">
                              <FileText size={14} className="text-gray-500 mt-0.5" />
                              <p className="text-sm text-gray-700">{log.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mb-20">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                const isActive = page === currentPage;
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 text-sm font-medium rounded-lg ${
                      isActive
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
        )}
      </div>
    </MobileLayout>
  );
}
