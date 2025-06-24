"use client";

import {
	AlertCircle,
	Calendar,
	Check,
	CheckCircle,
	Clock,
	FileText,
	Pill,
	User,
	X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import MobileLayout from "@/components/MobileLayout";
import { api } from "@/trpc/react";

export default function LogDosePage() {
	const params = useParams();
	const router = useRouter();
	const petId = params.id as string;
	const medicationId = params.medId as string;

	const [formData, setFormData] = useState({
		status: "given" as "given" | "missed" | "skipped",
		actualTime: new Date().toISOString().slice(0, 16), // datetime-local format
		notes: "",
	});

	const { data: pet } = api.pet.getById.useQuery({ id: petId });
	const { data: medications } = api.medication.getByPet.useQuery({ petId });

	const medication = medications?.find((m) => m.id === medicationId);

	const logDoseMutation = api.medication.logDose.useMutation({
		onSuccess: () => {
			router.push(`/pets/${petId}/medications`);
		},
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!medication) return;

		try {
			await logDoseMutation.mutateAsync({
				medicationId: medication.id,
				status: formData.status,
				actualTime: new Date(formData.actualTime),
				notes: formData.notes || undefined,
			});
		} catch (error) {
			console.error("Failed to log dose:", error);
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "given":
				return <CheckCircle className="text-green-600" size={20} />;
			case "missed":
				return <X className="text-red-600" size={20} />;
			case "skipped":
				return <AlertCircle className="text-yellow-600" size={20} />;
			default:
				return <Clock className="text-gray-600" size={20} />;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "given":
				return "bg-green-50 border-green-200 text-green-800";
			case "missed":
				return "bg-red-50 border-red-200 text-red-800";
			case "skipped":
				return "bg-yellow-50 border-yellow-200 text-yellow-800";
			default:
				return "bg-gray-50 border-gray-200 text-gray-800";
		}
	};

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
					<div>
						<h1 className="font-bold text-gray-900 text-xl">Log Dose</h1>
						<p className="text-gray-600 text-sm">
							{pet.name} • {medication.name}
						</p>
					</div>
				</div>

				{/* Medication Info Card */}
				<div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
					<div className="flex items-start gap-3">
						<div className="rounded-full bg-blue-100 p-2">
							<Pill className="text-blue-600" size={20} />
						</div>
						<div className="flex-1">
							<h3 className="mb-1 font-semibold text-gray-900">
								{medication.name}
							</h3>
							<div className="space-y-1 text-gray-600 text-sm">
								{medication.dosage && (
									<p>
										Dosage: {medication.dosage}
										{medication.unit && ` ${medication.unit}`}
									</p>
								)}
								{medication.instructions && (
									<p>Instructions: {medication.instructions}</p>
								)}
							</div>

							{/* Recent Logs */}
							{medication.logs && medication.logs.length > 0 && (
								<div className="mt-3 border-gray-100 border-t pt-3">
									<p className="mb-2 font-medium text-gray-700 text-xs">
										Recent doses:
									</p>
									<div className="space-y-1">
										{medication.logs.slice(0, 2).map((log) => (
											<div
												key={log.id}
												className="flex items-center gap-2 text-xs"
											>
												{getStatusIcon(log.status)}
												<span className="text-gray-600">
													{log.actualTime
														? new Date(log.actualTime).toLocaleString()
														: new Date(log.createdAt).toLocaleString()}
												</span>
												<span
													className={`rounded-full px-1.5 py-0.5 font-medium text-xs ${getStatusColor(log.status)}`}
												>
													{log.status}
												</span>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Log Form */}
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Status Selection */}
					<div>
						<label className="mb-3 block font-medium text-gray-700 text-sm">
							Status *
						</label>
						<div className="grid grid-cols-1 gap-3">
							{[
								{
									value: "given",
									label: "Given",
									description: "Medication was administered successfully",
									icon: CheckCircle,
								},
								{
									value: "missed",
									label: "Missed",
									description: "Medication was not given at scheduled time",
									icon: X,
								},
								{
									value: "skipped",
									label: "Skipped",
									description: "Medication was intentionally not given",
									icon: AlertCircle,
								},
							].map((option) => (
								<button
									key={option.value}
									type="button"
									onClick={() =>
										setFormData((prev) => ({
											...prev,
											status: option.value as any,
										}))
									}
									className={`rounded-lg border-2 p-4 text-left transition-colors ${
										formData.status === option.value
											? getStatusColor(option.value)
													.replace("bg-", "bg-")
													.replace("50", "100") + " border-current"
											: "border-gray-200 bg-white hover:border-gray-300"
									}`}
								>
									<div className="flex items-start gap-3">
										<option.icon
											size={20}
											className={
												formData.status === option.value
													? "text-current"
													: "text-gray-400"
											}
										/>
										<div>
											<div className="mb-1 font-medium text-gray-900">
												{option.label}
											</div>
											<div className="text-gray-600 text-sm">
												{option.description}
											</div>
										</div>
									</div>
								</button>
							))}
						</div>
					</div>

					{/* Date/Time */}
					<div>
						<label className="mb-2 block font-medium text-gray-700 text-sm">
							{formData.status === "given" ? "Time Given" : "Time of Event"} *
						</label>
						<div className="relative">
							<input
								type="datetime-local"
								value={formData.actualTime}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										actualTime: e.target.value,
									}))
								}
								max={new Date().toISOString().slice(0, 16)}
								required
								className="w-full rounded-lg border border-gray-300 px-3 py-2 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
							/>
							<Clock
								className="-translate-y-1/2 absolute top-1/2 left-3 transform text-gray-400"
								size={16}
							/>
						</div>
						<p className="mt-1 text-gray-500 text-xs">
							Cannot be in the future
						</p>
					</div>

					{/* Quick Time Buttons */}
					<div>
						<label className="mb-2 block font-medium text-gray-700 text-sm">
							Quick Select
						</label>
						<div className="grid grid-cols-3 gap-2">
							{[
								{ label: "Now", minutes: 0 },
								{ label: "5 min ago", minutes: -5 },
								{ label: "15 min ago", minutes: -15 },
								{ label: "30 min ago", minutes: -30 },
								{ label: "1 hr ago", minutes: -60 },
								{ label: "2 hrs ago", minutes: -120 },
							].map((option) => (
								<button
									key={option.label}
									type="button"
									onClick={() => {
										const date = new Date();
										date.setMinutes(date.getMinutes() + option.minutes);
										setFormData((prev) => ({
											...prev,
											actualTime: date.toISOString().slice(0, 16),
										}));
									}}
									className="rounded-lg bg-gray-100 px-3 py-2 text-gray-700 text-sm transition-colors hover:bg-gray-200"
								>
									{option.label}
								</button>
							))}
						</div>
					</div>

					{/* Notes */}
					<div>
						<label className="mb-2 block font-medium text-gray-700 text-sm">
							Notes (Optional)
						</label>
						<div className="relative">
							<textarea
								value={formData.notes}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, notes: e.target.value }))
								}
								placeholder={
									formData.status === "given"
										? "Any observations after giving the medication..."
										: formData.status === "missed"
											? "Why was the dose missed..."
											: "Reason for skipping this dose..."
								}
								rows={3}
								className="w-full rounded-lg border border-gray-300 px-3 py-2 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
							/>
							<FileText
								className="absolute top-3 left-3 text-gray-400"
								size={16}
							/>
						</div>
					</div>

					{/* Form Actions */}
					<div className="flex gap-3 pt-6 pb-20">
						<button
							type="button"
							onClick={() => router.back()}
							className="flex-1 rounded-lg bg-gray-100 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={logDoseMutation.isPending}
							className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{logDoseMutation.isPending ? (
								<div className="flex items-center justify-center gap-2">
									<div className="h-4 w-4 animate-spin rounded-full border-white border-b-2" />
									Logging...
								</div>
							) : (
								<div className="flex items-center justify-center gap-2">
									<Check size={20} />
									Log Dose
								</div>
							)}
						</button>
					</div>

					{/* Error Display */}
					{logDoseMutation.error && (
						<div className="rounded-lg border border-red-200 bg-red-50 p-4">
							<div className="flex items-start gap-2">
								<AlertCircle size={16} className="mt-0.5 text-red-600" />
								<div>
									<p className="font-medium text-red-800 text-sm">
										Failed to log dose
									</p>
									<p className="mt-1 text-red-700 text-sm">
										{logDoseMutation.error.message}
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
