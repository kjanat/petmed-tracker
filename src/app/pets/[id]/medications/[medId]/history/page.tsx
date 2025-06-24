"use client";

import {
	Activity,
	AlertCircle,
	Calendar,
	CheckCircle,
	Clock,
	Download,
	FileText,
	Filter,
	Pill,
	TrendingUp,
	User,
	X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import MobileLayout from "@/components/MobileLayout";
import { api } from "@/trpc/react";

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

	const medication = medications?.find((m) => m.id === medicationId);

	if (!pet || !medication) {
		return (
			<MobileLayout activeTab="pets">
				<div className="px-4 py-8 text-center">
					<Pill className="mx-auto mb-4 text-gray-400" size={48} />
					<h2 className="mb-4 font-semibold text-gray-900 text-xl">
						{!pet ? "Pet not found" : "Medication not found"}
					</h2>
					<button
						onClick={() => router.back()}
						className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
					>
						Go Back
					</button>
				</div>
			</MobileLayout>
		);
	}

	// Filter logs based on status and date range
	const filteredLogs =
		medication.logs?.filter((log) => {
			// Status filter
			if (statusFilter !== "all" && log.status !== statusFilter) return false;

			// Date range filter
			if (dateRange !== "all") {
				const dayLimit = Number.parseInt(dateRange);
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
		currentPage * logsPerPage,
	);

	// Calculate statistics
	const stats = {
		total: medication.logs?.length || 0,
		given: medication.logs?.filter((l) => l.status === "given").length || 0,
		missed: medication.logs?.filter((l) => l.status === "missed").length || 0,
		skipped: medication.logs?.filter((l) => l.status === "skipped").length || 0,
	};

	const adherenceRate =
		stats.total > 0 ? Math.round((stats.given / stats.total) * 100) : 0;

	const exportData = () => {
		const csvContent = [
			["Date", "Time", "Status", "Given By", "Notes"].join(","),
			...filteredLogs.map((log) =>
				[
					new Date(log.actualTime || log.createdAt).toLocaleDateString(),
					new Date(log.actualTime || log.createdAt).toLocaleTimeString(),
					log.status,
					log.givenBy?.name || log.givenBy?.email || "Unknown",
					`"${log.notes || ""}"`,
				].join(","),
			),
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
				<div className="mb-6 flex items-center gap-3">
					<button
						onClick={() => router.back()}
						className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
					>
						←
					</button>
					<div className="flex-1">
						<h1 className="font-bold text-gray-900 text-xl">
							Medication History
						</h1>
						<p className="text-gray-600 text-sm">
							{pet.name} • {medication.name}
						</p>
					</div>
					<button
						onClick={exportData}
						className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
					>
						<Download size={20} />
					</button>
				</div>

				{/* Medication Info */}
				<div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
					<div className="flex items-start gap-3">
						<div className="rounded-full bg-blue-100 p-2">
							<Pill className="text-blue-600" size={20} />
						</div>
						<div className="flex-1">
							<h3 className="mb-1 font-semibold text-gray-900">
								{medication.name}
							</h3>
							<div className="grid grid-cols-2 gap-4 text-gray-600 text-sm">
								{medication.dosage && (
									<div>
										<span className="font-medium">Dosage:</span>{" "}
										{medication.dosage}
										{medication.unit && ` ${medication.unit}`}
									</div>
								)}
								<div>
									<span className="font-medium">Status:</span>{" "}
									<span
										className={
											medication.isActive ? "text-green-600" : "text-gray-500"
										}
									>
										{medication.isActive ? "Active" : "Inactive"}
									</span>
								</div>
							</div>
							{medication.instructions && (
								<p className="mt-2 text-gray-600 text-sm">
									<span className="font-medium">Instructions:</span>{" "}
									{medication.instructions}
								</p>
							)}
						</div>
					</div>
				</div>

				{/* Statistics Cards */}
				<div className="mb-6 grid grid-cols-2 gap-4">
					<div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
						<div className="mb-2 flex items-center gap-2">
							<TrendingUp className="text-blue-600" size={16} />
							<span className="font-medium text-gray-700 text-sm">
								Adherence Rate
							</span>
						</div>
						<div className="mb-1 font-bold text-2xl text-blue-600">
							{adherenceRate}%
						</div>
						<div className="text-gray-500 text-xs">
							{stats.given} of {stats.total} doses
						</div>
					</div>

					<div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
						<div className="mb-2 flex items-center gap-2">
							<Activity className="text-green-600" size={16} />
							<span className="font-medium text-gray-700 text-sm">
								Total Logged
							</span>
						</div>
						<div className="mb-1 font-bold text-2xl text-green-600">
							{stats.total}
						</div>
						<div className="text-gray-500 text-xs">
							{stats.missed} missed • {stats.skipped} skipped
						</div>
					</div>
				</div>

				{/* Filters */}
				<div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
					<div className="mb-3 flex items-center gap-2">
						<Filter className="text-gray-500" size={16} />
						<span className="font-medium text-gray-700">Filters</span>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="mb-1 block font-medium text-gray-700 text-sm">
								Status
							</label>
							<select
								value={statusFilter}
								onChange={(e) => {
									setStatusFilter(e.target.value);
									setCurrentPage(1);
								}}
								className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
							>
								<option value="all">All Status</option>
								<option value="given">Given</option>
								<option value="missed">Missed</option>
								<option value="skipped">Skipped</option>
								<option value="pending">Pending</option>
							</select>
						</div>

						<div>
							<label className="mb-1 block font-medium text-gray-700 text-sm">
								Time Period
							</label>
							<select
								value={dateRange}
								onChange={(e) => {
									setDateRange(e.target.value);
									setCurrentPage(1);
								}}
								className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
							>
								<option value="all">All Time</option>
								<option value="7">Last 7 days</option>
								<option value="30">Last 30 days</option>
								<option value="90">Last 3 months</option>
								<option value="365">Last year</option>
							</select>
						</div>
					</div>

					<div className="mt-3 text-gray-600 text-sm">
						Showing {filteredLogs.length} of {medication.logs?.length || 0}{" "}
						total entries
					</div>
				</div>

				{/* History List */}
				<div className="mb-6 space-y-3">
					{paginatedLogs.length === 0 ? (
						<div className="py-12 text-center">
							<FileText className="mx-auto mb-4 text-gray-400" size={48} />
							<h3 className="mb-2 font-semibold text-gray-900 text-lg">
								No logs found
							</h3>
							<p className="text-gray-600">
								{statusFilter !== "all" || dateRange !== "all"
									? "Try adjusting your filters to see more results."
									: "No doses have been logged for this medication yet."}
							</p>
						</div>
					) : (
						paginatedLogs.map((log) => {
							const StatusIcon =
								STATUS_ICONS[log.status as keyof typeof STATUS_ICONS];
							const statusColor =
								STATUS_COLORS[log.status as keyof typeof STATUS_COLORS];

							return (
								<div
									key={log.id}
									className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
								>
									<div className="flex items-start gap-3">
										<div className={`rounded-full p-2 ${statusColor}`}>
											<StatusIcon size={16} />
										</div>

										<div className="flex-1">
											<div className="mb-2 flex items-center justify-between">
												<span
													className={`rounded-full px-2 py-1 font-medium text-xs ${statusColor}`}
												>
													{log.status}
												</span>
												<div className="text-gray-500 text-sm">
													{log.actualTime
														? new Date(log.actualTime).toLocaleDateString()
														: new Date(log.createdAt).toLocaleDateString()}
												</div>
											</div>

											<div className="space-y-1 text-sm">
												<div className="flex items-center gap-2 text-gray-600">
													<Clock size={14} />
													<span>
														{log.actualTime
															? new Date(log.actualTime).toLocaleTimeString()
															: new Date(log.createdAt).toLocaleTimeString()}
													</span>
												</div>

												{log.givenBy && (
													<div className="flex items-center gap-2 text-gray-600">
														<User size={14} />
														<span>{log.givenBy.name || log.givenBy.email}</span>
													</div>
												)}

												{log.notes && (
													<div className="mt-2 rounded-lg bg-gray-50 p-2">
														<div className="flex items-start gap-2">
															<FileText
																size={14}
																className="mt-0.5 text-gray-500"
															/>
															<p className="text-gray-700 text-sm">
																{log.notes}
															</p>
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
					<div className="mb-20 flex items-center justify-between">
						<button
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							disabled={currentPage === 1}
							className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
										className={`h-8 w-8 rounded-lg font-medium text-sm ${
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
										className={`h-8 w-8 rounded-lg font-medium text-sm ${
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
							onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							disabled={currentPage === totalPages}
							className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
						>
							Next
						</button>
					</div>
				)}
			</div>
		</MobileLayout>
	);
}
