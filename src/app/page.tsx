"use client";

import { AlertCircle, CheckCircle, Clock, Plus } from "lucide-react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import MobileLayout from "@/components/MobileLayout";
import { api } from "@/trpc/react";

// Types
type Pet = {
	id: string;
	name: string;
	species: string | null;
	breed: string | null;
	birthDate: Date | null;
	weight: number | null;
	notes: string | null;
	qrCodeId: string;
	createdAt: Date;
	updatedAt: Date;
};

type TodayScheduleItem = {
	medicationId: string;
	medicationName: string;
	dosage: string | null;
	unit: string | null;
	instructions: string | null;
	scheduledTime: Date;
	status: string;
	givenBy?: {
		id: string;
		name: string | null;
		email: string | null;
	} | null;
	actualTime?: Date | null;
	notes?: string | null;
	logId?: string | null;
};

export default function HomePage() {
	const { data: session, status } = useSession();
	const { data: pets } = api.pet.getMyPets.useQuery(undefined, {
		enabled: !!session,
	});

	if (status === "loading") {
		return (
			<MobileLayout>
				<div className="flex min-h-[400px] items-center justify-center">
					<div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
				</div>
			</MobileLayout>
		);
	}

	if (!session) {
		return (
			<MobileLayout>
				<div className="px-4 py-8">
					<div className="text-center">
						<h2 className="mb-4 font-bold text-2xl text-gray-900">
							Welcome to PetMed Tracker
						</h2>
						<p className="mb-8 text-gray-600">
							Keep track of your pet's medication schedule and never miss a
							dose.
						</p>
						<button
							type="button"
							onClick={() => signIn("discord")}
							className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
						>
							Sign In with Discord
						</button>
					</div>
				</div>
			</MobileLayout>
		);
	}

	if (!pets || pets.length === 0) {
		return (
			<MobileLayout activeTab="home">
				<div className="px-4 py-8">
					<div className="text-center">
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
		<MobileLayout activeTab="home">
			<div className="px-4 py-6">
				{/* Welcome Section */}
				<div className="mb-6">
					<h2 className="mb-2 font-semibold text-gray-900 text-xl">
						Welcome back, {session.user.name}!
					</h2>
					<p className="text-gray-600">Here's today's medication schedule</p>
				</div>

				{/* Today's Schedule for Each Pet */}
				<div className="space-y-6">
					{pets.map((pet) => (
						<PetTodaySchedule key={pet.id} pet={pet} />
					))}
				</div>

				{/* Quick Actions */}
				<div className="mt-8 grid grid-cols-2 gap-4">
					<Link
						href="/pets/new"
						className="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm transition-shadow hover:shadow-md"
					>
						<Plus className="mx-auto mb-2 text-blue-600" size={24} />
						<span className="font-medium text-gray-900 text-sm">Add Pet</span>
					</Link>

					<Link
						href="/qr-scanner"
						className="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm transition-shadow hover:shadow-md"
					>
						<Clock className="mx-auto mb-2 text-green-600" size={24} />
						<span className="font-medium text-gray-900 text-sm">Scan QR</span>
					</Link>
				</div>
			</div>
		</MobileLayout>
	);
}

function PetTodaySchedule({ pet }: { pet: Pet }) {
	const { data: todaySchedule } = api.medication.getTodaySchedule.useQuery(
		{ petId: pet.id },
		{ refetchInterval: 30000 }, // Refresh every 30 seconds
	);

	const logMedicationMutation = api.medication.logMedication.useMutation({
		onSuccess: () => {
			// Refetch the schedule after logging medication
			window.location.reload();
		},
	});

	const handleGiveMedication = (item: TodayScheduleItem) => {
		logMedicationMutation.mutate({
			medicationId: item.medicationId,
			scheduledTime: new Date(item.scheduledTime),
			status: "given",
		});
	};

	if (!todaySchedule || todaySchedule.length === 0) {
		return (
			<div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
				<h3 className="mb-2 font-semibold text-gray-900">{pet.name}</h3>
				<p className="text-gray-600 text-sm">
					No medications scheduled for today
				</p>
			</div>
		);
	}

	return (
		<div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
			<h3 className="mb-4 font-semibold text-gray-900">{pet.name}</h3>

			<div className="space-y-3">
				{todaySchedule.map((item: TodayScheduleItem) => (
					<div
						key={`${item.medicationId}-${item.scheduledTime.toISOString()}`}
						className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
					>
						<div className="flex-1">
							<div className="mb-1 flex items-center gap-2">
								{item.status === "given" ? (
									<CheckCircle size={16} className="text-green-600" />
								) : item.status === "missed" ? (
									<AlertCircle size={16} className="text-red-600" />
								) : (
									<Clock size={16} className="text-gray-400" />
								)}
								<span className="font-medium text-gray-900">
									{item.medicationName}
								</span>
							</div>

							<div className="text-gray-600 text-sm">
								<div>
									{new Date(item.scheduledTime).toLocaleTimeString("en-US", {
										hour: "numeric",
										minute: "2-digit",
										hour12: true,
									})}
									{item.dosage &&
										` • ${item.dosage}${item.unit ? ` ${item.unit}` : ""}`}
								</div>

								{item.status === "given" && item.givenBy && item.actualTime && (
									<div className="mt-1 text-green-600 text-xs">
										Given by {item.givenBy.name} at{" "}
										{new Date(item.actualTime).toLocaleTimeString("en-US", {
											hour: "numeric",
											minute: "2-digit",
											hour12: true,
										})}
									</div>
								)}
							</div>
						</div>

						{item.status === "pending" && (
							<button
								type="button"
								onClick={() => handleGiveMedication(item)}
								disabled={logMedicationMutation.isPending}
								className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
							>
								{logMedicationMutation.isPending ? "..." : "Give"}
							</button>
						)}
					</div>
				))}
			</div>

			<Link
				href={`/pets/${pet.id}`}
				className="mt-4 inline-block font-medium text-blue-600 text-sm hover:text-blue-700"
			>
				View {pet.name}'s full schedule →
			</Link>
		</div>
	);
}
