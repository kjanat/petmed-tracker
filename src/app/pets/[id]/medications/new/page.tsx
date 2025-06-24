"use client";

import { AlertCircle, Calendar, CheckCircle, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useId, useState } from "react";
import MobileLayout from "@/components/MobileLayout";
import { api } from "@/trpc/react";

const COMMON_MEDICATIONS = [
	{ name: "Heartgard Plus", type: "Preventive" },
	{ name: "NexGard", type: "Preventive" },
	{ name: "Apoquel", type: "Allergy" },
	{ name: "Rimadyl", type: "Pain/Inflammation" },
	{ name: "Metacam", type: "Pain/Inflammation" },
	{ name: "Tramadol", type: "Pain" },
	{ name: "Gabapentin", type: "Pain/Seizure" },
	{ name: "Prednisone", type: "Anti-inflammatory" },
	{ name: "Cephalexin", type: "Antibiotic" },
	{ name: "Amoxicillin", type: "Antibiotic" },
];

const FREQUENCY_OPTIONS = [
	"Once daily",
	"Twice daily",
	"Three times daily",
	"Every 8 hours",
	"Every 12 hours",
	"Once weekly",
	"Once monthly",
	"As needed",
	"Custom",
];

const UNIT_OPTIONS = [
	"mg",
	"ml",
	"tablets",
	"capsules",
	"drops",
	"cc",
	"units",
];

export default function NewMedicationPage() {
	// Generate unique IDs for form elements
	const medicationNameId = useId();
	const dosageId = useId();
	const unitId = useId();
	const instructionsId = useId();
	const frequencyId = useId();
	const timeOfDayId = useId();
	const startDateId = useId();
	const endDateId = useId();
	const notesId = useId();

	const params = useParams();
	const router = useRouter();
	const petId = params.id as string;

	const [formData, setFormData] = useState({
		name: "",
		dosage: "",
		unit: "",
		instructions: "",
		frequency: "",
		timeOfDay: "",
		startDate: new Date().toISOString().split("T")[0],
		endDate: "",
		notes: "",
	});

	const { data: pet } = api.pet.getById.useQuery({ id: petId });

	const createMedicationMutation = api.medication.create.useMutation({
		onSuccess: (_medication) => {
			router.push(`/pets/${petId}/medications`);
		},
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			await createMedicationMutation.mutateAsync({
				petId,
				name: formData.name,
				dosage: formData.dosage || undefined,
				unit: formData.unit || undefined,
				instructions: formData.instructions || undefined,
			});
		} catch (error) {
			console.error("Failed to create medication:", error);
		}
	};

	if (!pet) {
		return (
			<MobileLayout activeTab="pets">
				<div className="flex min-h-[400px] items-center justify-center">
					<div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
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
						type="button"
						onClick={() => router.back()}
						className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
					>
						←
					</button>
					<div>
						<h1 className="font-bold text-gray-900 text-xl">Add Medication</h1>
						<p className="text-gray-600 text-sm">{pet.name}</p>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Medication Name */}
					<div>
						<label
							htmlFor={medicationNameId}
							className="mb-2 block font-medium text-gray-700 text-sm"
						>
							Medication Name *
						</label>
						<div className="relative">
							<input
								id={medicationNameId}
								type="text"
								value={formData.name}
								onChange={(e) => {
									setFormData((prev) => ({ ...prev, name: e.target.value }));
									setShowSuggestions(e.target.value.length > 0);
								}}
								onFocus={() => setShowSuggestions(formData.name.length > 0)}
								onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
								placeholder="Enter medication name"
								required
								className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						{/* Suggestions */}
						{showSuggestions && (
							<div className="absolute top-full right-0 left-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
								{COMMON_MEDICATIONS.filter((med) =>
									med.name.toLowerCase().includes(formData.name.toLowerCase()),
								).map((med, index) => (
									<button
										key={`${med.name}-${index}`}
										type="button"
										onClick={() => {
											setFormData((prev) => ({ ...prev, name: med.name }));
											setShowSuggestions(false);
										}}
										className="w-full border-gray-100 border-b px-4 py-2 text-left last:border-b-0 hover:bg-gray-50"
									>
										<div className="font-medium">{med.name}</div>
										<div className="text-gray-600 text-sm">{med.type}</div>
									</button>
								))}
							</div>
						)}
					</div>

					{/* Dosage and Unit */}
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label
								htmlFor={dosageId}
								className="mb-2 block font-medium text-gray-700 text-sm"
							>
								Dosage
							</label>
							<input
								id={dosageId}
								type="text"
								value={formData.dosage}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, dosage: e.target.value }))
								}
								placeholder="25"
								className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<div>
							<label
								htmlFor={unitId}
								className="mb-2 block font-medium text-gray-700 text-sm"
							>
								Unit
							</label>
							<select
								id={unitId}
								value={formData.unit}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, unit: e.target.value }))
								}
								className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
							>
								<option value="">Select unit</option>
								{UNIT_OPTIONS.map((unit) => (
									<option key={unit} value={unit}>
										{unit}
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Instructions */}
					<div>
						<label
							htmlFor={instructionsId}
							className="mb-2 block font-medium text-gray-700 text-sm"
						>
							Instructions
						</label>
						<textarea
							id={instructionsId}
							value={formData.instructions}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									instructions: e.target.value,
								}))
							}
							placeholder="Give with food, morning dose, etc."
							rows={3}
							className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					{/* Schedule */}
					<div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
						<h3 className="mb-3 flex items-center gap-2 font-medium text-blue-900 text-lg">
							<Calendar size={20} />
							Schedule
						</h3>

						<div className="space-y-4">
							<div>
								<label
									htmlFor={frequencyId}
									className="mb-2 block font-medium text-blue-900 text-sm"
								>
									Frequency
								</label>
								<select
									id={frequencyId}
									value={formData.frequency}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											frequency: e.target.value,
										}))
									}
									className="w-full rounded-lg border border-blue-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
								>
									<option value="">Select frequency</option>
									{FREQUENCY_OPTIONS.map((freq) => (
										<option key={freq} value={freq}>
											{freq}
										</option>
									))}
								</select>
							</div>

							{formData.frequency && (
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label
											htmlFor={timeOfDayId}
											className="mb-2 block font-medium text-blue-900 text-sm"
										>
											Time of Day
										</label>
										<input
											id={timeOfDayId}
											type="time"
											value={formData.timeOfDay}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													timeOfDay: e.target.value,
												}))
											}
											className="w-full rounded-lg border border-blue-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
										/>
									</div>

									<div>
										<label
											htmlFor={startDateId}
											className="mb-2 block font-medium text-blue-900 text-sm"
										>
											Start Date
										</label>
										<input
											id={startDateId}
											type="date"
											value={formData.startDate}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													startDate: e.target.value,
												}))
											}
											className="w-full rounded-lg border border-blue-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
										/>
									</div>
								</div>
							)}

							{formData.frequency && (
								<div>
									<label
										htmlFor={endDateId}
										className="mb-2 block font-medium text-blue-900 text-sm"
									>
										End Date (Optional)
									</label>
									<input
										id={endDateId}
										type="date"
										value={formData.endDate}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												endDate: e.target.value,
											}))
										}
										className="w-full rounded-lg border border-blue-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
									/>
								</div>
							)}
						</div>
					</div>

					{/* Additional Notes */}
					<div>
						<label
							htmlFor={notesId}
							className="mb-2 block font-medium text-gray-700 text-sm"
						>
							Additional Notes
						</label>
						<textarea
							id={notesId}
							value={formData.notes}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, notes: e.target.value }))
							}
							placeholder="Any additional notes or reminders..."
							rows={3}
							className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
						/>
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
							disabled={
								!formData.name.trim() || createMedicationMutation.isPending
							}
							className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{createMedicationMutation.isPending ? (
								<div className="flex items-center justify-center gap-2">
									<div className="h-4 w-4 animate-spin rounded-full border-white border-b-2" />
									Creating...
								</div>
							) : (
								<div className="flex items-center justify-center gap-2">
									<Plus size={20} />
									Add Medication
								</div>
							)}
						</button>
					</div>

					{/* Error Display */}
					{createMedicationMutation.error && (
						<div className="rounded-lg border border-red-200 bg-red-50 p-4">
							<div className="flex items-start gap-2">
								<AlertCircle size={16} className="mt-0.5 text-red-600" />
								<div>
									<p className="font-medium text-red-800 text-sm">
										Failed to create medication
									</p>
									<p className="mt-1 text-red-700 text-sm">
										{createMedicationMutation.error.message}
									</p>
								</div>
							</div>
						</div>
					)}
				</form>

				{/* Success Message */}
				{createMedicationMutation.isSuccess && (
					<div className="fixed top-4 right-4 left-4 z-50 rounded-lg border border-green-200 bg-green-50 p-4">
						<div className="flex items-center gap-2">
							<CheckCircle size={16} className="text-green-600" />
							<p className="font-medium text-green-800 text-sm">
								Medication added successfully!
							</p>
						</div>
					</div>
				)}
			</div>
		</MobileLayout>
	);
}
