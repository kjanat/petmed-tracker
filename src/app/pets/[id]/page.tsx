"use client";

import {
	Activity,
	AlertCircle,
	Baby,
	Calendar,
	CheckCircle,
	Clock,
	Coffee,
	Edit3,
	FileText,
	Heart,
	MoreVertical,
	Pill,
	Plus,
	QrCode,
	Settings,
	Stethoscope,
	Trash2,
	User,
	Users,
	Weight,
	X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import QRCode from "react-qr-code";
import MobileLayout from "@/components/MobileLayout";
import { api } from "@/trpc/react";

export default function PetDetailsPage() {
	const params = useParams();
	const router = useRouter();
	const petId = params.id as string;

	const [showQr, setShowQr] = useState(false);
	const [editingPet, setEditingPet] = useState(false);
	const [showAddCaregiver, setShowAddCaregiver] = useState(false);
	const [caregiverEmail, setCaregiverEmail] = useState("");
	const [showSettings, setShowSettings] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const {
		data: pet,
		isLoading,
		refetch,
	} = api.pet.getById.useQuery({ id: petId });
	const { data: medications } = api.medication.getByPet.useQuery({ petId });

	const updatePetMutation = api.pet.update.useMutation({
		onSuccess: () => {
			setEditingPet(false);
			refetch();
		},
	});

	const addCaregiverMutation = api.pet.addCaregiver.useMutation({
		onSuccess: () => {
			setShowAddCaregiver(false);
			setCaregiverEmail("");
			refetch();
		},
	});

	const removeCaregiverMutation = api.pet.removeCaregiver.useMutation({
		onSuccess: () => {
			refetch();
		},
	});

	const deletePetMutation = api.pet.delete.useMutation({
		onSuccess: (result) => {
			toast.success(`${result.deletedPet} has been deleted successfully`);
			router.push("/pets");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	// Close settings dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Element;
			if (showSettings && !target.closest(".settings-dropdown")) {
				setShowSettings(false);
			}
		};

		if (showSettings) {
			document.addEventListener("mousedown", handleClickOutside);
			return () =>
				document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [showSettings]);

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
					<Heart className="mx-auto mb-4 text-gray-400" size={48} />
					<h2 className="mb-4 font-semibold text-gray-900 text-xl">
						Pet not found
					</h2>
					<p className="mb-6 text-gray-600">
						This pet doesn't exist or you don't have access to it.
					</p>
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
	const recentLogs =
		medications
			?.flatMap((m) => m.logs)
			.sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			)
			.slice(0, 10) || [];

	return (
		<MobileLayout activeTab="pets">
			<div className="px-4 py-6">
				{/* Header */}
				<div className="relative mb-6 flex items-center justify-between">
					<button
						onClick={() => router.back()}
						className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
					>
						←
					</button>
					<h1 className="font-bold text-gray-900 text-xl">{pet.name}</h1>
					<div className="relative">
						<button
							onClick={() => setShowSettings(!showSettings)}
							className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
						>
							<MoreVertical size={20} />
						</button>

						{/* Settings Dropdown */}
						{showSettings && (
							<div className="settings-dropdown absolute top-full right-0 z-10 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
								<button
									onClick={() => {
										setEditingPet(true);
										setShowSettings(false);
									}}
									className="flex w-full items-center gap-3 px-4 py-3 text-left text-gray-700 transition-colors hover:bg-gray-50"
								>
									<Edit3 size={16} />
									Edit Pet Details
								</button>
								<button
									onClick={() => {
										setShowQr(true);
										setShowSettings(false);
									}}
									className="flex w-full items-center gap-3 px-4 py-3 text-left text-gray-700 transition-colors hover:bg-gray-50"
								>
									<QrCode size={16} />
									Show QR Code
								</button>
								<div className="border-gray-100 border-t">
									<button
										onClick={() => {
											setShowDeleteConfirm(true);
											setShowSettings(false);
										}}
										className="flex w-full items-center gap-3 px-4 py-3 text-left text-red-600 transition-colors hover:bg-red-50"
									>
										<Trash2 size={16} />
										Delete Pet
									</button>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Pet Info Card */}
				<div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
					<div className="mb-4 flex items-start gap-4">
						<div className="rounded-full bg-blue-100 p-3">
							<Heart className="text-blue-600" size={24} />
						</div>
						<div className="flex-1">
							<h2 className="mb-1 font-semibold text-gray-900 text-xl">
								{pet.name}
							</h2>
							{pet.species && (
								<p className="mb-2 text-gray-600 text-sm">
									{pet.species}
									{pet.breed && ` • ${pet.breed}`}
								</p>
							)}

							<div className="grid grid-cols-2 gap-4 text-sm">
								{pet.birthDate && (
									<div className="flex items-center gap-2 text-gray-600">
										<Baby size={16} />
										<span>{new Date(pet.birthDate).toLocaleDateString()}</span>
									</div>
								)}
								{pet.weight && (
									<div className="flex items-center gap-2 text-gray-600">
										<Weight size={16} />
										<span>{pet.weight} lbs</span>
									</div>
								)}
							</div>
						</div>
					</div>

					{pet.notes && (
						<div className="mb-4 rounded-lg bg-gray-50 p-3">
							<div className="mb-2 flex items-center gap-2">
								<FileText size={16} className="text-gray-500" />
								<span className="font-medium text-gray-700 text-sm">Notes</span>
							</div>
							<p className="text-gray-600 text-sm">{pet.notes}</p>
						</div>
					)}

					{/* Quick Stats */}
					<div className="grid grid-cols-3 gap-4 border-gray-100 border-t pt-4">
						<div className="text-center">
							<div className="font-semibold text-blue-600 text-lg">
								{activeMedications.length}
							</div>
							<div className="text-gray-500 text-xs">Active Meds</div>
						</div>
						<div className="text-center">
							<div className="font-semibold text-green-600 text-lg">
								{pet.userPets?.length || 0}
							</div>
							<div className="text-gray-500 text-xs">Caregivers</div>
						</div>
						<div className="text-center">
							<div className="font-semibold text-lg text-purple-600">
								{recentLogs.length}
							</div>
							<div className="text-gray-500 text-xs">Recent Logs</div>
						</div>
					</div>
				</div>

				{/* Quick Actions */}
				<div className="mb-6 grid grid-cols-2 gap-3">
					<Link
						href={`/pets/${pet.id}/medications`}
						className="flex items-center gap-3 rounded-lg bg-blue-600 p-4 text-white transition-colors hover:bg-blue-700"
					>
						<Pill size={20} />
						<div>
							<div className="font-medium">Medications</div>
							<div className="text-xs opacity-90">
								{activeMedications.length} active
							</div>
						</div>
					</Link>

					<Link
						href={`/pets/${pet.id}/food`}
						className="flex items-center gap-3 rounded-lg bg-green-600 p-4 text-white transition-colors hover:bg-green-700"
					>
						<Coffee size={20} />
						<div>
							<div className="font-medium">Food Schedule</div>
							<div className="text-xs opacity-90">Feeding tracker</div>
						</div>
					</Link>
				</div>

				{/* Secondary Actions */}
				<div className="mb-6 grid grid-cols-2 gap-3">
					<Link
						href={`/pets/${pet.id}/schedule`}
						className="flex items-center gap-3 rounded-lg bg-purple-600 p-4 text-white transition-colors hover:bg-purple-700"
					>
						<Calendar size={20} />
						<div>
							<div className="font-medium">Schedule</div>
							<div className="text-xs opacity-90">Calendar view</div>
						</div>
					</Link>

					<button
						onClick={() => setShowQr(true)}
						className="flex items-center gap-3 rounded-lg bg-gray-100 p-4 text-gray-700 transition-colors hover:bg-gray-200"
					>
						<QrCode size={20} />
						<div>
							<div className="font-medium">QR Code</div>
							<div className="text-xs opacity-75">Share access</div>
						</div>
					</button>
				</div>

				{/* Medications Overview */}
				{activeMedications.length > 0 && (
					<div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
						<div className="mb-4 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Pill className="text-blue-600" size={20} />
								<h3 className="font-semibold text-gray-900">
									Current Medications
								</h3>
							</div>
							<Link
								href={`/pets/${pet.id}/medications/new`}
								className="rounded p-1 text-blue-600 hover:bg-blue-50"
							>
								<Plus size={16} />
							</Link>
						</div>

						<div className="space-y-3">
							{activeMedications.slice(0, 3).map((med) => (
								<div
									key={med.id}
									className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
								>
									<div>
										<div className="font-medium text-gray-900">{med.name}</div>
										{med.dosage && (
											<div className="text-gray-600 text-sm">
												{med.dosage}
												{med.unit ? ` ${med.unit}` : ""}
											</div>
										)}
										<div className="text-gray-500 text-xs">
											{med.schedules?.length || 0} schedule
											{med.schedules?.length !== 1 ? "s" : ""}
										</div>
									</div>

									<div className="flex items-center gap-2">
										{med.logs && med.logs.length > 0 ? (
											<div className="flex items-center gap-1 text-green-600">
												<CheckCircle size={16} />
												<span className="text-xs">
													{new Date(
														med.logs[0]!.createdAt,
													).toLocaleDateString()}
												</span>
											</div>
										) : (
											<div className="flex items-center gap-1 text-amber-600">
												<AlertCircle size={16} />
												<span className="text-xs">No recent doses</span>
											</div>
										)}
									</div>
								</div>
							))}

							{activeMedications.length > 3 && (
								<Link
									href={`/pets/${pet.id}/medications`}
									className="block py-2 text-center font-medium text-blue-600 text-sm hover:text-blue-700"
								>
									View all {activeMedications.length} medications →
								</Link>
							)}
						</div>
					</div>
				)}

				{/* Recent Activity */}
				{recentLogs.length > 0 && (
					<div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
						<div className="mb-4 flex items-center gap-2">
							<Activity className="text-green-600" size={20} />
							<h3 className="font-semibold text-gray-900">Recent Activity</h3>
						</div>

						<div className="space-y-3">
							{recentLogs.slice(0, 5).map((log) => (
								<div
									key={log.id}
									className="flex items-start gap-3 rounded-lg bg-gray-50 p-3"
								>
									<div className="mt-1 rounded-full bg-green-100 p-1">
										<CheckCircle className="text-green-600" size={12} />
									</div>
									<div className="flex-1">
										<div className="font-medium text-gray-900 text-sm">
											Medication dose logged
										</div>
										<div className="mb-1 text-gray-600 text-xs">
											Status: {log.status}
											{log.actualTime &&
												` • Given at ${new Date(log.actualTime).toLocaleTimeString()}`}
										</div>
										<div className="text-gray-500 text-xs">
											{new Date(log.createdAt).toLocaleString()}
											{log.givenBy &&
												` • by ${log.givenBy.name || log.givenBy.email}`}
										</div>
										{log.notes && (
											<div className="mt-1 text-gray-600 text-xs italic">
												"{log.notes}"
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Caregivers */}
				<div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
					<div className="mb-4 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Users className="text-purple-600" size={20} />
							<h3 className="font-semibold text-gray-900">Caregivers</h3>
						</div>
						<button
							onClick={() => setShowAddCaregiver(true)}
							className="rounded p-1 text-purple-600 hover:bg-purple-50"
						>
							<Plus size={16} />
						</button>
					</div>

					<div className="space-y-3">
						{pet.userPets?.map((up) => (
							<div
								key={up.userId}
								className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
							>
								<div className="flex items-center gap-3">
									<div className="rounded-full bg-purple-100 p-2">
										<User className="text-purple-600" size={16} />
									</div>
									<div>
										<div className="font-medium text-gray-900">
											{up.user.name || up.user.email}
										</div>
										<div className="text-gray-600 text-sm capitalize">
											{up.role}
										</div>
									</div>
								</div>

								{up.role !== "owner" && (
									<button
										onClick={() => {
											if (
												confirm(
													`Remove ${up.user.name || up.user.email} as a caregiver?`,
												)
											) {
												removeCaregiverMutation.mutate({
													petId: pet.id,
													userId: up.userId,
												});
											}
										}}
										className="text-red-600 text-sm hover:text-red-700"
									>
										Remove
									</button>
								)}
							</div>
						))}
					</div>
				</div>

				{/* Additional Actions */}
				<div className="mb-20 grid grid-cols-2 gap-3">
					<Link
						href={`/pets/${pet.id}/schedule`}
						className="flex items-center gap-3 rounded-lg bg-gray-100 p-4 text-gray-700 transition-colors hover:bg-gray-200"
					>
						<Calendar size={20} />
						<div>
							<div className="font-medium">Schedule</div>
							<div className="text-xs opacity-75">View calendar</div>
						</div>
					</Link>

					<button
						onClick={() => setEditingPet(true)}
						className="flex items-center gap-3 rounded-lg bg-gray-100 p-4 text-gray-700 transition-colors hover:bg-gray-200"
					>
						<Settings size={20} />
						<div>
							<div className="font-medium">Settings</div>
							<div className="text-xs opacity-75">Edit pet info</div>
						</div>
					</button>
				</div>
			</div>

			{/* QR Code Modal */}
			{showQr && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
					<div className="w-full max-w-sm rounded-lg bg-white p-6">
						<h3 className="mb-4 text-center font-semibold text-gray-900 text-lg">
							{pet.name}'s QR Code
						</h3>

						<div
							id="qr-code-modal"
							className="mb-4 rounded-lg bg-white p-4 text-center"
						>
							<QRCode
								value={`${window.location.origin}/qr?id=${pet.qrCodeId}`}
								size={200}
								style={{ height: "auto", maxWidth: "100%", width: "100%" }}
							/>
						</div>

						<p className="mb-4 text-center text-gray-600 text-sm">
							Share this QR code with other caregivers or keep it handy for
							emergency access
						</p>

						<div className="flex gap-2">
							<button
								onClick={() => setShowQr(false)}
								className="flex-1 rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200"
							>
								Close
							</button>
							<button
								onClick={() => {
									// Download QR code logic (same as pets page)
									const qrContainer = document.querySelector("#qr-code-modal");
									const svg = qrContainer?.querySelector("svg");
									if (svg) {
										const canvas = document.createElement("canvas");
										const ctx = canvas.getContext("2d");
										const data = new XMLSerializer().serializeToString(svg);
										const DOMURL = window.URL || window.webkitURL || window;
										const img = new Image();
										const svgBlob = new Blob([data], {
											type: "image/svg+xml;charset=utf-8",
										});
										const url = DOMURL.createObjectURL(svgBlob);

										img.onload = () => {
											canvas.width = img.width;
											canvas.height = img.height;
											ctx?.drawImage(img, 0, 0);
											DOMURL.revokeObjectURL(url);

											canvas.toBlob((blob) => {
												if (blob) {
													const url = URL.createObjectURL(blob);
													const a = document.createElement("a");
													a.href = url;
													a.download = `${pet.name}-medication-qr.png`;
													a.click();
													URL.revokeObjectURL(url);
												}
											});
										};

										img.src = url;
									}
								}}
								className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
							>
								Download
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			{showDeleteConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
					<div className="w-full max-w-sm rounded-lg bg-white p-6">
						<div className="mb-4 flex items-center gap-3">
							<div className="rounded-full bg-red-100 p-2">
								<Trash2 className="text-red-600" size={20} />
							</div>
							<h3 className="font-semibold text-gray-900 text-lg">
								Delete {pet.name}?
							</h3>
						</div>

						<div className="mb-6">
							<p className="mb-4 text-gray-600">
								This action cannot be undone. This will permanently delete{" "}
								<strong>{pet.name}</strong> and all associated data including:
							</p>

							<ul className="mb-4 space-y-1 text-gray-600 text-sm">
								<li>
									• {activeMedications.length} active medication
									{activeMedications.length !== 1 ? "s" : ""}
								</li>
								<li>• All medication logs and history</li>
								<li>• All food schedules and logs</li>
								<li>
									• {pet.userPets?.length || 0} caregiver relationship
									{(pet.userPets?.length || 0) !== 1 ? "s" : ""}
								</li>
							</ul>

							<div className="rounded-lg border border-red-200 bg-red-50 p-3">
								<p className="font-medium text-red-800 text-sm">
									⚠️ This action is permanent and cannot be reversed.
								</p>
							</div>
						</div>

						<div className="flex gap-3">
							<button
								onClick={() => setShowDeleteConfirm(false)}
								className="flex-1 rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200"
							>
								Cancel
							</button>
							<button
								onClick={() => {
									deletePetMutation.mutate({ id: pet.id });
								}}
								disabled={deletePetMutation.isPending}
								className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
							>
								{deletePetMutation.isPending ? (
									<div className="flex items-center justify-center gap-2">
										<div className="h-4 w-4 animate-spin rounded-full border-white border-b-2" />
										Deleting...
									</div>
								) : (
									"Delete Pet"
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Add Caregiver Modal */}
			{showAddCaregiver && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
					<div className="w-full max-w-sm rounded-lg bg-white p-6">
						<h3 className="mb-4 font-semibold text-gray-900 text-lg">
							Add Caregiver
						</h3>

						<div className="mb-4">
							<label className="mb-2 block font-medium text-gray-700 text-sm">
								Email Address
							</label>
							<input
								type="email"
								value={caregiverEmail}
								onChange={(e) => setCaregiverEmail(e.target.value)}
								placeholder="caregiver@example.com"
								className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<div className="flex gap-2">
							<button
								onClick={() => {
									setShowAddCaregiver(false);
									setCaregiverEmail("");
								}}
								className="flex-1 rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200"
							>
								Cancel
							</button>
							<button
								onClick={() => {
									if (caregiverEmail.trim()) {
										addCaregiverMutation.mutate({
											petId: pet.id,
											email: caregiverEmail.trim(),
											role: "caregiver",
										});
									}
								}}
								disabled={
									!caregiverEmail.trim() || addCaregiverMutation.isPending
								}
								className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
							>
								{addCaregiverMutation.isPending ? "Adding..." : "Add"}
							</button>
						</div>

						{addCaregiverMutation.error && (
							<p className="mt-2 text-red-600 text-sm">
								{addCaregiverMutation.error.message}
							</p>
						)}
					</div>
				</div>
			)}

			{/* Edit Pet Modal */}
			{editingPet && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
					<div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6">
						<h3 className="mb-4 font-semibold text-gray-900 text-lg">
							Edit {pet.name}
						</h3>

						<form
							onSubmit={(e) => {
								e.preventDefault();
								const formData = new FormData(e.currentTarget);
								const data = Object.fromEntries(formData);

								updatePetMutation.mutate({
									id: pet.id,
									name: data.name as string,
									species: (data.species as string) || undefined,
									breed: (data.breed as string) || undefined,
									birthDate: data.birthDate
										? new Date(data.birthDate as string)
										: undefined,
									weight: data.weight
										? Number.parseFloat(data.weight as string)
										: undefined,
									notes: (data.notes as string) || undefined,
								});
							}}
							className="space-y-4"
						>
							<div>
								<label className="mb-1 block font-medium text-gray-700 text-sm">
									Name *
								</label>
								<input
									name="name"
									type="text"
									defaultValue={pet.name}
									required
									className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="mb-1 block font-medium text-gray-700 text-sm">
										Species
									</label>
									<input
										name="species"
										type="text"
										defaultValue={pet.species || ""}
										placeholder="Dog, Cat, etc."
										className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
									/>
								</div>

								<div>
									<label className="mb-1 block font-medium text-gray-700 text-sm">
										Breed
									</label>
									<input
										name="breed"
										type="text"
										defaultValue={pet.breed || ""}
										placeholder="Golden Retriever"
										className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="mb-1 block font-medium text-gray-700 text-sm">
										Birth Date
									</label>
									<input
										name="birthDate"
										type="date"
										defaultValue={
											pet.birthDate
												? new Date(pet.birthDate).toISOString().split("T")[0]
												: ""
										}
										className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
									/>
								</div>

								<div>
									<label className="mb-1 block font-medium text-gray-700 text-sm">
										Weight (lbs)
									</label>
									<input
										name="weight"
										type="number"
										step="0.1"
										min="0"
										defaultValue={pet.weight || ""}
										className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
									/>
								</div>
							</div>

							<div>
								<label className="mb-1 block font-medium text-gray-700 text-sm">
									Notes
								</label>
								<textarea
									name="notes"
									rows={3}
									defaultValue={pet.notes || ""}
									placeholder="Any special notes about your pet..."
									className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
								/>
							</div>

							<div className="flex gap-2 pt-4">
								<button
									type="button"
									onClick={() => setEditingPet(false)}
									className="flex-1 rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={updatePetMutation.isPending}
									className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
								>
									{updatePetMutation.isPending ? "Saving..." : "Save Changes"}
								</button>
							</div>
						</form>

						{updatePetMutation.error && (
							<p className="mt-2 text-red-600 text-sm">
								{updatePetMutation.error.message}
							</p>
						)}
					</div>
				</div>
			)}
		</MobileLayout>
	);
}
