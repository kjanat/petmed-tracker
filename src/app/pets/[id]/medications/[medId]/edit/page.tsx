"use client";

import {
	AlertCircle,
	Archive,
	CheckCircle,
	Pill,
	Save,
	Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MobileLayout from "@/components/MobileLayout";
import { api } from "@/trpc/react";

const UNIT_OPTIONS = [
	"mg",
	"ml",
	"tablets",
	"capsules",
	"drops",
	"cc",
	"units",
];

export default function EditMedicationPage() {
	const params = useParams();
	const router = useRouter();
	const petId = params.id as string;
	const medicationId = params.medId as string;

	const [formData, setFormData] = useState({
		name: "",
		dosage: "",
		unit: "",
		instructions: "",
		isActive: true,
	});

	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const { data: pet } = api.pet.getById.useQuery({ id: petId });
	const { data: medications, refetch: refetchMedications } =
		api.medication.getByPet.useQuery({ petId });

	const medication = medications?.find((m) => m.id === medicationId);

	const updateMedicationMutation = api.medication.update.useMutation({
		onSuccess: () => {
			refetchMedications();
			router.push(`/pets/${petId}/medications`);
		},
	});

	const deleteMedicationMutation = api.medication.update.useMutation({
		onSuccess: () => {
			refetchMedications();
			router.push(`/pets/${petId}/medications`);
		},
	});

	// Populate form when medication data loads
	useEffect(() => {
		if (medication) {
			setFormData({
				name: medication.name,
				dosage: medication.dosage || "",
				unit: medication.unit || "",
				instructions: medication.instructions || "",
				isActive: medication.isActive,
			});
		}
	}, [medication]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!medication) return;

		try {
			await updateMedicationMutation.mutateAsync({
				id: medication.id,
				name: formData.name,
				dosage: formData.dosage || undefined,
				unit: formData.unit || undefined,
				instructions: formData.instructions || undefined,
				isActive: formData.isActive,
			});
		} catch (error) {
			console.error("Failed to update medication:", error);
		}
	};

	const handleDelete = async () => {
		if (!medication) return;

		try {
			// Instead of actually deleting, we'll deactivate the medication
			await deleteMedicationMutation.mutateAsync({
				id: medication.id,
				isActive: false,
			});
		} catch (error) {
			console.error("Failed to delete medication:", error);
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
						type="button"
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
						type="button"
						onClick={() => router.back()}
						className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
					>
						←
					</button>
					<div>
						<h1 className="font-bold text-gray-900 text-xl">Edit Medication</h1>
						<p className="text-gray-600 text-sm">{pet.name}</p>
					</div>
				</div>

				{/* Status Banner */}
				{!medication.isActive && (
					<div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
						<div className="flex items-start gap-2">
							<Archive size={16} className="mt-0.5 text-amber-600" />
							<div>
								<p className="font-medium text-amber-800 text-sm">
									This medication is currently inactive
								</p>
								<p className="mt-1 text-amber-700 text-sm">
									Activate it to resume tracking and scheduling
								</p>
							</div>
						</div>
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Medication Name */}
					<div>
						<label className="mb-2 block font-medium text-gray-700 text-sm">
							Medication Name *
						</label>
						<input
							type="text"
							value={formData.name}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, name: e.target.value }))
							}
							placeholder="Enter medication name"
							required
							className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
						/>
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

					{/* Status Toggle */}
					<div>
						<label className="mb-3 block font-medium text-gray-700 text-sm">
							Status
						</label>
						<div className="grid grid-cols-2 gap-3">
							<button
								type="button"
								onClick={() =>
									setFormData((prev) => ({ ...prev, isActive: true }))
								}
								className={`rounded-lg border-2 p-3 text-left transition-colors ${
									formData.isActive
										? "border-green-200 bg-green-50 text-green-800"
										: "border-gray-200 bg-white hover:border-gray-300"
								}`}
							>
								<div className="mb-1 flex items-center gap-2">
									<CheckCircle
										size={16}
										className={
											formData.isActive ? "text-green-600" : "text-gray-400"
										}
									/>
									<span className="font-medium">Active</span>
								</div>
								<div className="text-sm opacity-75">
									Medication is being tracked and scheduled
								</div>
							</button>

							<button
								type="button"
								onClick={() =>
									setFormData((prev) => ({ ...prev, isActive: false }))
								}
								className={`rounded-lg border-2 p-3 text-left transition-colors ${
									!formData.isActive
										? "border-gray-300 bg-gray-50 text-gray-800"
										: "border-gray-200 bg-white hover:border-gray-300"
								}`}
							>
								<div className="mb-1 flex items-center gap-2">
									<Archive
										size={16}
										className={
											!formData.isActive ? "text-gray-600" : "text-gray-400"
										}
									/>
									<span className="font-medium">Inactive</span>
								</div>
								<div className="text-sm opacity-75">
									Medication is paused but data is preserved
								</div>
							</button>
						</div>
					</div>

					{/* Recent Activity Summary */}
					{medication.logs && medication.logs.length > 0 && (
						<div className="rounded-lg bg-blue-50 p-4">
							<h3 className="mb-2 font-semibold text-blue-900">
								Recent Activity
							</h3>
							<div className="space-y-1 text-sm">
								<div className="flex justify-between">
									<span className="text-blue-700">Total doses logged:</span>
									<span className="font-medium text-blue-900">
										{medication.logs.length}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-blue-700">Last dose:</span>
									<span className="font-medium text-blue-900">
										{medication.logs[0]?.actualTime
											? new Date(
													medication.logs[0].actualTime,
												).toLocaleDateString()
											: new Date(
													medication.logs[0]?.createdAt || "",
												).toLocaleDateString()}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-blue-700">Status:</span>
									<span
										className={`font-medium ${
											medication.logs[0]?.status === "given"
												? "text-green-600"
												: medication.logs[0]?.status === "missed"
													? "text-red-600"
													: "text-yellow-600"
										}`}
									>
										{medication.logs[0]?.status || "Unknown"}
									</span>
								</div>
							</div>
						</div>
					)}

					{/* Form Actions */}
					<div className="flex gap-3 pt-6">
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
								!formData.name.trim() || updateMedicationMutation.isPending
							}
							className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{updateMedicationMutation.isPending ? (
								<div className="flex items-center justify-center gap-2">
									<div className="h-4 w-4 animate-spin rounded-full border-white border-b-2" />
									Saving...
								</div>
							) : (
								<div className="flex items-center justify-center gap-2">
									<Save size={20} />
									Save Changes
								</div>
							)}
						</button>
					</div>

					{/* Danger Zone */}
					<div className="border-gray-200 border-t pt-6">
						<div className="rounded-lg bg-red-50 p-4">
							<h3 className="mb-2 flex items-center gap-2 font-semibold text-red-900">
								<AlertCircle size={16} />
								Danger Zone
							</h3>
							<p className="mb-4 text-red-700 text-sm">
								Deleting this medication will permanently remove all associated
								schedules and dose logs. This action cannot be undone.
							</p>
							<button
								type="button"
								onClick={() => setShowDeleteConfirm(true)}
								className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-red-700"
							>
								<Trash2 size={16} />
								Delete Medication
							</button>
						</div>
					</div>

					{/* Error Display */}
					{updateMedicationMutation.error && (
						<div className="rounded-lg border border-red-200 bg-red-50 p-4">
							<div className="flex items-start gap-2">
								<AlertCircle size={16} className="mt-0.5 text-red-600" />
								<div>
									<p className="font-medium text-red-800 text-sm">
										Failed to update medication
									</p>
									<p className="mt-1 text-red-700 text-sm">
										{updateMedicationMutation.error.message}
									</p>
								</div>
							</div>
						</div>
					)}
				</form>

				{/* Delete Confirmation Modal */}
				{showDeleteConfirm && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
						<div className="w-full max-w-sm rounded-lg bg-white p-6">
							<h3 className="mb-4 font-semibold text-gray-900 text-lg">
								Delete {medication.name}?
							</h3>

							<p className="mb-6 text-gray-600">
								This will permanently delete this medication and all its
								associated schedules and dose logs. This action cannot be
								undone.
							</p>

							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => setShowDeleteConfirm(false)}
									className="flex-1 rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleDelete}
									disabled={deleteMedicationMutation.isPending}
									className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
								>
									{deleteMedicationMutation.isPending
										? "Deleting..."
										: "Delete"}
								</button>
							</div>

							{deleteMedicationMutation.error && (
								<p className="mt-2 text-red-600 text-sm">
									{deleteMedicationMutation.error.message}
								</p>
							)}
						</div>
					</div>
				)}

				{/* Success Message */}
				{updateMedicationMutation.isSuccess && (
					<div className="fixed top-4 right-4 left-4 z-50 rounded-lg border border-green-200 bg-green-50 p-4">
						<div className="flex items-center gap-2">
							<CheckCircle size={16} className="text-green-600" />
							<p className="font-medium text-green-800 text-sm">
								Medication updated successfully!
							</p>
						</div>
					</div>
				)}
			</div>
		</MobileLayout>
	);
}
