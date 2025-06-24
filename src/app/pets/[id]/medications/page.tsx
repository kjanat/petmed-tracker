"use client";

import {
	Activity,
	AlertCircle,
	Calendar,
	CheckCircle,
	MoreVertical,
	Pill,
	Plus,
	Settings,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import MobileLayout from "@/components/MobileLayout";
import { api } from "@/trpc/react";

export default function PetMedicationsPage() {
	const params = useParams();
	const router = useRouter();
	const petId = params.id as string;

	const [selectedMed, setSelectedMed] = useState<string | null>(null);
	const [showInactive, setShowInactive] = useState(false);

	const { data: pet } = api.pet.getById.useQuery({ id: petId });
	const {
		data: medications,
		isLoading,
		refetch,
	} = api.medication.getByPet.useQuery({ petId });

	const updateMedicationMutation = api.medication.update.useMutation({
		onSuccess: () => {
			refetch();
		},
	});

	const deleteMedicationMutation = api.medication.update.useMutation({
		onSuccess: () => {
			refetch();
		},
	});

	if (isLoading) {
		return (
			<MobileLayout activeTab="pets">
				<div className="flex min-h-[400px] items-center justify-center">
					<div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
				</div>
			</MobileLayout>
		);
	}

	if (!pet) {
		return (
			<MobileLayout activeTab="pets">
				<div className="px-4 py-8 text-center">
					<Pill className="mx-auto mb-4 text-gray-400" size={48} />
					<h2 className="mb-4 font-semibold text-gray-900 text-xl">
						Pet not found
					</h2>
					<Link
						href="/pets"
						className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
					>
						Back to Pets
					</Link>
				</div>
			</MobileLayout>
		);
	}

	const activeMedications = medications?.filter((m) => m.isActive) || [];
	const inactiveMedications = medications?.filter((m) => !m.isActive) || [];
	const displayMedications = showInactive
		? medications || []
		: activeMedications;

	return (
		<MobileLayout activeTab="pets">
			<div className="px-4 py-6">
				{/* Header */}
				<div className="mb-6 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={() => router.back()}
							className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
						>
							←
						</button>
						<div>
							<h1 className="font-bold text-gray-900 text-xl">Medications</h1>
							<p className="text-gray-600 text-sm">{pet.name}</p>
						</div>
					</div>

					<Link
						href={`/pets/${petId}/medications/new`}
						className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
					>
						Add Medication
					</Link>
				</div>

				{/* Filter Tabs */}
				<div className="mb-6 flex gap-2">
					<button
						type="button"
						onClick={() => setShowInactive(false)}
						className={`rounded-lg px-4 py-2 font-medium transition-colors ${
							!showInactive
								? "bg-blue-600 text-white"
								: "bg-gray-100 text-gray-600 hover:bg-gray-200"
						}`}
					>
						Active ({activeMedications.length})
					</button>
					{inactiveMedications.length > 0 && (
						<button
							type="button"
							onClick={() => setShowInactive(true)}
							className={`rounded-lg px-4 py-2 font-medium transition-colors ${
								showInactive
									? "bg-blue-600 text-white"
									: "bg-gray-100 text-gray-600 hover:bg-gray-200"
							}`}
						>
							All ({medications?.length || 0})
						</button>
					)}
				</div>

				{/* Empty State */}
				{displayMedications.length === 0 && (
					<div className="py-12 text-center">
						<Pill className="mx-auto mb-4 text-gray-400" size={48} />
						<h2 className="mb-4 font-semibold text-gray-900 text-xl">
							{showInactive ? "No medications yet" : "No active medications"}
						</h2>
						<p className="mb-6 text-gray-600">
							{showInactive
								? `Add ${pet.name}'s first medication to start tracking doses and schedules.`
								: `All of ${pet.name}'s medications are currently inactive.`}
						</p>
						<Link
							href={`/pets/${petId}/medications/new`}
							className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
						>
							<Plus size={20} />
							Add Medication
						</Link>
					</div>
				)}

				{/* Medications List */}
				<div className="space-y-4">
					{displayMedications.map((medication) => (
						<div
							key={medication.id}
							className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${
								!medication.isActive ? "opacity-75" : ""
							}`}
						>
							{/* Header */}
							<div className="mb-3 flex items-start justify-between">
								<div className="flex-1">
									<div className="mb-1 flex items-center gap-2">
										<h3 className="font-semibold text-gray-900 text-lg">
											{medication.name}
										</h3>
										{!medication.isActive && (
											<span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600 text-xs">
												Inactive
											</span>
										)}
									</div>

									{medication.dosage && (
										<p className="mb-1 text-gray-600 text-sm">
											{medication.dosage}
											{medication.unit && ` ${medication.unit}`}
										</p>
									)}

									{medication.instructions && (
										<p className="text-gray-500 text-sm">
											{medication.instructions}
										</p>
									)}
								</div>

								<button
									type="button"
									onClick={() =>
										setSelectedMed(
											selectedMed === medication.id ? null : medication.id,
										)
									}
									className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
								>
									<MoreVertical size={16} />
								</button>
							</div>

							{/* Schedules */}
							{medication.schedules && medication.schedules.length > 0 && (
								<div className="mb-4">
									<div className="mb-2 flex items-center gap-2">
										<Calendar size={16} className="text-blue-600" />
										<span className="font-medium text-gray-700 text-sm">
											Schedules ({medication.schedules.length})
										</span>
									</div>

									<div className="space-y-2">
										{medication.schedules.slice(0, 2).map((schedule) => {
											const times = schedule.times
												? JSON.parse(schedule.times)
												: [];
											const daysOfWeek = schedule.daysOfWeek
												? JSON.parse(schedule.daysOfWeek)
												: null;

											return (
												<div
													key={schedule.id}
													className="flex items-center justify-between rounded-lg bg-blue-50 p-2 text-sm"
												>
													<div>
														<div className="font-medium text-blue-900">
															{schedule.scheduleType} schedule
														</div>
														<div className="text-blue-700">
															{times.length > 0 && `at ${times.join(", ")}`}
															{daysOfWeek &&
																` • ${daysOfWeek.length} days/week`}
														</div>
													</div>
													<div className="text-blue-600 text-xs">
														{schedule.isActive ? "Active" : "Inactive"}
													</div>
												</div>
											);
										})}

										{medication.schedules.length > 2 && (
											<div className="text-center text-gray-500 text-xs">
												+{medication.schedules.length - 2} more schedules
											</div>
										)}
									</div>
								</div>
							)}

							{/* Recent Logs */}
							{medication.logs && medication.logs.length > 0 && (
								<div className="mb-4">
									<div className="mb-2 flex items-center gap-2">
										<Activity size={16} className="text-green-600" />
										<span className="font-medium text-gray-700 text-sm">
											Recent Doses
										</span>
									</div>

									<div className="space-y-2">
										{medication.logs.slice(0, 3).map((log) => (
											<div
												key={log.id}
												className="flex items-center justify-between rounded-lg bg-green-50 p-2 text-sm"
											>
												<div>
													<div className="mb-1 flex items-center gap-2">
														<CheckCircle size={12} className="text-green-600" />
														<span className="font-medium text-green-900">
															{log.status === "given"
																? "Dose given"
																: `Status: ${log.status}`}
														</span>
													</div>
													<div className="text-green-700 text-xs">
														{log.actualTime
															? new Date(log.actualTime).toLocaleString()
															: new Date(log.createdAt).toLocaleString()}
														{log.givenBy &&
															` • by ${log.givenBy.name || log.givenBy.email}`}
													</div>
												</div>

												<div className="text-green-600 text-xs">
													{log.status}
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Status */}
							<div className="flex items-center justify-between border-gray-100 border-t pt-3">
								<div className="flex items-center gap-2">
									{medication.logs && medication.logs.length > 0 ? (
										<>
											<CheckCircle size={16} className="text-green-600" />
											<span className="text-green-700 text-sm">
												Last dose:{" "}
												{medication.logs[0]?.actualTime
													? new Date(medication.logs[0].actualTime).toLocaleDateString()
													: medication.logs[0]?.createdAt
														? new Date(medication.logs[0].createdAt).toLocaleDateString()
														: "No date"}
											</span>
										</>
									) : (
										<>
											<AlertCircle size={16} className="text-amber-600" />
											<span className="text-amber-700 text-sm">
												No doses recorded
											</span>
										</>
									)}
								</div>

								<div className="flex gap-2">
									<Link
										href={`/pets/${petId}/medications/${medication.id}/edit`}
										className="rounded-lg bg-gray-100 px-3 py-1 text-gray-700 text-sm transition-colors hover:bg-gray-200"
									>
										Edit
									</Link>

									<Link
										href={`/pets/${petId}/medications/${medication.id}/log`}
										className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700"
									>
										Log Dose
									</Link>
								</div>
							</div>

							{/* Action Menu */}
							{selectedMed === medication.id && (
								<div className="mt-3 border-gray-100 border-t pt-3">
									<div className="grid grid-cols-2 gap-2">
										<Link
											href={`/pets/${petId}/medications/${medication.id}/schedule`}
											className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-blue-700 text-sm transition-colors hover:bg-blue-100"
										>
											<Calendar size={16} />
											Manage Schedule
										</Link>

										<Link
											href={`/pets/${petId}/medications/${medication.id}/history`}
											className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-green-700 text-sm transition-colors hover:bg-green-100"
										>
											<Activity size={16} />
											View History
										</Link>

										<button
											type="button"
											onClick={() => {
												updateMedicationMutation.mutate({
													id: medication.id,
													isActive: !medication.isActive,
												});
											}}
											className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
												medication.isActive
													? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
													: "bg-green-50 text-green-700 hover:bg-green-100"
											}`}
										>
											<Settings size={16} />
											{medication.isActive ? "Deactivate" : "Activate"}
										</button>

										<button
											type="button"
											onClick={() => {
												if (
													confirm(
														"Are you sure you want to delete this medication? This action cannot be undone.",
													)
												) {
													deleteMedicationMutation.mutate({
														id: medication.id,
														isActive: false,
													});
												}
											}}
											className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-red-700 text-sm transition-colors hover:bg-red-100"
										>
											<Trash2 size={16} />
											Delete
										</button>
									</div>
								</div>
							)}
						</div>
					))}
				</div>

				{/* Quick Actions */}
				{displayMedications.length > 0 && (
					<div className="mt-8 mb-20">
						<div className="rounded-lg bg-gray-50 p-4">
							<h3 className="mb-3 font-semibold text-gray-900">
								Quick Actions
							</h3>
							<div className="grid grid-cols-2 gap-3">
								<Link
									href={`/pets/${petId}/medications/new`}
									className="flex items-center gap-2 rounded-lg bg-blue-600 p-3 text-white transition-colors hover:bg-blue-700"
								>
									<Plus size={20} />
									<span>Add Medication</span>
								</Link>

								<Link
									href={`/pets/${petId}/medications/schedule`}
									className="flex items-center gap-2 rounded-lg bg-purple-600 p-3 text-white transition-colors hover:bg-purple-700"
								>
									<Calendar size={20} />
									<span>Schedule View</span>
								</Link>
							</div>
						</div>
					</div>
				)}
			</div>
		</MobileLayout>
	);
}
