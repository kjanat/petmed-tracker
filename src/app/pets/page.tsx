"use client";

import { Calendar, Heart, Plus, QrCode } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import QRCode from "react-qr-code";
import MobileLayout from "@/components/MobileLayout";
import { api } from "@/trpc/react";

export default function PetsPage() {
	const [showQrFor, setShowQrFor] = useState<string | null>(null);
	const { data: pets, isLoading } = api.pet.getMyPets.useQuery();

	if (isLoading) {
		return (
			<MobileLayout activeTab="pets">
				<div className="flex min-h-[400px] items-center justify-center">
					<div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
				</div>
			</MobileLayout>
		);
	}

	if (!pets || pets.length === 0) {
		return (
			<MobileLayout activeTab="pets">
				<div className="px-4 py-8">
					<div className="text-center">
						<Heart className="mx-auto mb-4 text-gray-400" size={48} />
						<h2 className="mb-4 font-semibold text-gray-900 text-xl">
							No pets yet
						</h2>
						<p className="mb-6 text-gray-600">
							Add your first pet to start tracking their medication schedule.
						</p>
						<Link
							href="/pets/new"
							className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
						>
							<Plus size={20} />
							Add Your First Pet
						</Link>
					</div>
				</div>
			</MobileLayout>
		);
	}

	return (
		<MobileLayout activeTab="pets">
			<div className="px-4 py-6">
				{/* Header */}
				<div className="mb-6 flex items-center justify-between">
					<h1 className="font-bold text-2xl text-gray-900">My Pets</h1>
					<Link
						href="/pets/new"
						className="rounded-lg bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700"
					>
						<Plus size={20} />
					</Link>
				</div>

				{/* Pets Grid */}
				<div className="space-y-4">
					{pets.map((pet) => (
						<div
							key={pet.id}
							className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
						>
							<div className="mb-3 flex items-start justify-between">
								<div>
									<h3 className="mb-1 font-semibold text-gray-900 text-lg">
										{pet.name}
									</h3>
									{pet.species && (
										<p className="text-gray-600 text-sm">
											{pet.species}
											{pet.breed && ` • ${pet.breed}`}
										</p>
									)}
								</div>

								<button
									type="button"
									onClick={() =>
										setShowQrFor(showQrFor === pet.id ? null : pet.id)
									}
									className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
								>
									<QrCode size={20} />
								</button>
							</div>

							{/* QR Code Display */}
							{showQrFor === pet.id && (
								<div className="mb-4 rounded-lg bg-gray-50 p-4 text-center">
									<div
										id={`qr-code-${pet.id}`}
										className="inline-block rounded-lg bg-white p-4"
									>
										<QRCode
											value={`${window.location.origin}/qr?id=${pet.qrCodeId}`}
											size={200}
											style={{
												height: "auto",
												maxWidth: "100%",
												width: "100%",
											}}
										/>
									</div>
									<p className="mt-2 text-gray-600 text-sm">
										Scan this QR code to view {pet.name}'s medication schedule
									</p>
									<button
										type="button"
										className="mt-2 font-medium text-blue-600 text-sm hover:text-blue-700"
										onClick={() => {
											// Download QR code as PNG
											const qrContainer = document.querySelector(
												`#qr-code-${pet.id}`,
											);
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
									>
										Download QR Code
									</button>
								</div>
							)}

							{/* Medication Summary */}
							<div className="mb-4">
								<div className="mb-2 flex items-center gap-2">
									<Calendar size={16} className="text-gray-500" />
									<span className="font-medium text-gray-700 text-sm">
										Active Medications:{" "}
										{pet.medications?.filter((m) => m.isActive).length || 0}
									</span>
								</div>

								{pet.medications && pet.medications.length > 0 && (
									<div className="space-y-1">
										{pet.medications.slice(0, 3).map((med) => (
											<div key={med.id} className="text-gray-600 text-sm">
												• {med.name}
												{med.dosage &&
													` (${med.dosage}${med.unit ? ` ${med.unit}` : ""})`}
											</div>
										))}
										{pet.medications.length > 3 && (
											<div className="text-gray-500 text-sm">
												+{pet.medications.length - 3} more...
											</div>
										)}
									</div>
								)}
							</div>

							{/* Action Buttons */}
							<div className="flex gap-2">
								<Link
									href={`/pets/${pet.id}`}
									className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-center font-medium text-sm text-white transition-colors hover:bg-blue-700"
								>
									View Details
								</Link>
								<Link
									href={`/pets/${pet.id}/medications`}
									className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-center font-medium text-gray-700 text-sm transition-colors hover:bg-gray-200"
								>
									Medications
								</Link>
							</div>
						</div>
					))}
				</div>
			</div>
		</MobileLayout>
	);
}
