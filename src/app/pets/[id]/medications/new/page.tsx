"use client";

import { AlertCircle, Calendar, CheckCircle, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
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

	const [showSuggestions, setShowSuggestions] = useState(false);
	const [createSchedule, setCreateSchedule] = useState(true);

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

	const handleMedicationSelect = (
		medication: (typeof COMMON_MEDICATIONS)[0],
	) => {
		setFormData((prev) => ({
			...prev,
			name: medication.name,
		}));
		setShowSuggestions(false);
	};

	const filteredSuggestions = COMMON_MEDICATIONS.filter(
		(med) =>
			med.name.toLowerCase().includes(formData.name.toLowerCase()) ||
			med.type.toLowerCase().includes(formData.name.toLowerCase()),
	);

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
						<label className="mb-2 block font-medium text-gray-700 text-sm">
							Medication Name *
						</label>
						<div className="relative">
							<input
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

							{/* Suggestions Dropdown */}
							{showSuggestions && filteredSuggestions.length > 0 && (
								<div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
									{filteredSuggestions.slice(0, 8).map((med, index) => (
										<button
											key={index}
											type="button"
											onClick={() => handleMedicationSelect(med)}
											className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50"
										>
											<span className="font-medium">{med.name}</span>
											<span className="rounded bg-gray-100 px-2 py-1 text-gray-500 text-xs">
												{med.type}
											</span>
										</button>
									))}
								</div>
							)}
						</div>
						<p className="mt-1 text-gray-500 text-xs">
							Start typing to see common medications
						</p>
					</div>

					{/* Dosage and Unit */}
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="mb-2 block font-medium text-gray-700 text-sm">
								Dosage
							</label>
							<input
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
							<label className="mb-2 block font-medium text-gray-700 text-sm">
								Unit
							</label>
							<select
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
						<label className="mb-2 block font-medium text-gray-700 text-sm">
							Instructions
						</label>
						<textarea
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

					{/* Schedule Section */}
					<div className="rounded-lg bg-blue-50 p-4">
						<div className="mb-4 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Calendar className="text-blue-600" size={20} />
								<h3 className="font-semibold text-blue-900">Create Schedule</h3>
							</div>
							<button
								type="button"
								onClick={() => setCreateSchedule(!createSchedule)}
								className={`rounded-full px-3 py-1 font-medium text-sm transition-colors ${
									createSchedule
										? "bg-blue-600 text-white"
										: "border border-blue-600 bg-white text-blue-600"
								}`}
							>
								{createSchedule ? "Enabled" : "Disabled"}
							</button>
						</div>

						{createSchedule && (
							<div className="space-y-4">
								<div>
									<label className="mb-2 block font-medium text-blue-900 text-sm">
										Frequency
									</label>
									<select
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

								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="mb-2 block font-medium text-blue-900 text-sm">
											Time of Day
										</label>
										<input
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
										<label className="mb-2 block font-medium text-blue-900 text-sm">
											Start Date
										</label>
										<input
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

								<div>
									<label className="mb-2 block font-medium text-blue-900 text-sm">
										End Date (Optional)
									</label>
									<input
										type="date"
										value={formData.endDate}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												endDate: e.target.value,
											}))
										}
										min={formData.startDate}
										className="w-full rounded-lg border border-blue-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
									/>
									<p className="mt-1 text-blue-700 text-xs">
										Leave empty for ongoing medication
									</p>
								</div>
							</div>
						)}

						<div className="mt-4 rounded-lg bg-blue-100 p-3">
							<div className="flex items-start gap-2">
								<AlertCircle size={16} className="mt-0.5 text-blue-600" />
								<div className="text-blue-800 text-sm">
									<p className="mb-1 font-medium">Note about schedules</p>
									<p>
										You can {createSchedule ? "create a schedule now or " : ""}
										add schedules later from the medication details page.
										Schedules help track doses and send reminders.
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Additional Notes */}
					<div>
						<label className="mb-2 block font-medium text-gray-700 text-sm">
							Additional Notes
						</label>
						<textarea
							value={formData.notes}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, notes: e.target.value }))
							}
							placeholder="Any additional notes about this medication..."
							rows={2}
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
