"use client";

import {
	AlertCircle,
	ArrowLeft,
	Calendar,
	CheckCircle,
	Clock,
	Coffee,
	FileText,
	Minus,
	Save,
	User,
	XCircle,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import MobileLayout from "@/components/MobileLayout";
import { api } from "@/trpc/react";

interface LogFeedingPageProps {
	params: Promise<{ id: string; scheduleId: string }>;
}

export default function LogFeedingPage({ params }: LogFeedingPageProps) {
	const [resolvedParams, setResolvedParams] = useState<{
		id: string;
		scheduleId: string;
	} | null>(null);
	const [formData, setFormData] = useState({
		status: "fed" as "fed" | "missed" | "skipped",
		actualTime: "",
		notes: "",
	});
	const router = useRouter();

	// Resolve params
	useEffect(() => {
		params.then(setResolvedParams);
	}, [params]);

	const { data: pet } = api.pet.getById.useQuery(
		{ id: resolvedParams?.id ?? "" },
		{ enabled: !!resolvedParams?.id },
	);

	const { data: foodSchedules = [] } = api.food.getByPet.useQuery(
		{ petId: resolvedParams?.id ?? "" },
		{ enabled: !!resolvedParams?.id },
	);

	const schedule = foodSchedules.find(
		(s) => s.id === resolvedParams?.scheduleId,
	);

	// Initialize with current time
	useEffect(() => {
		const now = new Date();
		const timeString = now.toTimeString().slice(0, 5);
		setFormData((prev) => ({
			...prev,
			actualTime: timeString,
		}));
	}, []);

	const logFeedingMutation = api.food.logFeeding.useMutation({
		onSuccess: () => {
			toast.success("Feeding logged successfully!");
			router.push(`/pets/${resolvedParams?.id}/food`);
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!resolvedParams?.scheduleId) return;

		// Validation
		if (!formData.actualTime) {
			toast.error("Please select a time");
			return;
		}

		// Parse time and create Date object
		const [hours, minutes] = formData.actualTime.split(":").map(Number);
		if (hours === undefined || minutes === undefined) {
			toast.error("Invalid time format");
			return;
		}

		const actualTime = new Date();
		actualTime.setHours(hours, minutes, 0, 0);

		logFeedingMutation.mutate({
			scheduleId: resolvedParams.scheduleId,
			status: formData.status,
			actualTime,
			notes: formData.notes.trim() || undefined,
		});
	};

	const getStatusInfo = (status: string) => {
		switch (status) {
			case "fed":
				return {
					icon: <CheckCircle size={20} />,
					color: "text-green-600",
					bg: "bg-green-50",
					border: "border-green-200",
					label: "Fed",
					description: "Pet was fed as scheduled",
				};
			case "missed":
				return {
					icon: <XCircle size={20} />,
					color: "text-red-600",
					bg: "bg-red-50",
					border: "border-red-200",
					label: "Missed",
					description: "Feeding was missed or forgotten",
				};
			case "skipped":
				return {
					icon: <Minus size={20} />,
					color: "text-yellow-600",
					bg: "bg-yellow-50",
					border: "border-yellow-200",
					label: "Skipped",
					description: "Intentionally skipped feeding",
				};
			default:
				return {
					icon: <Clock size={20} />,
					color: "text-blue-600",
					bg: "bg-blue-50",
					border: "border-blue-200",
					label: "Pending",
					description: "Waiting to be fed",
				};
		}
	};

	if (!resolvedParams?.id || !schedule) {
		return (
			<MobileLayout>
				<div className="p-4">
					<div className="animate-pulse">
						<div className="mb-4 h-8 w-48 rounded bg-gray-200" />
						<div className="space-y-4">
							{[1, 2, 3].map((i) => (
								<div key={i} className="h-16 rounded bg-gray-200" />
							))}
						</div>
					</div>
				</div>
			</MobileLayout>
		);
	}

	return (
		<MobileLayout>
			<div className="p-4 pb-20">
				{/* Header */}
				<div className="mb-6 flex items-center gap-3">
					<button
						onClick={() => router.back()}
						className="rounded-lg p-2 transition-colors hover:bg-gray-100"
					>
						<ArrowLeft size={20} />
					</button>
					<div>
						<h1 className="font-bold text-gray-900 text-xl">Log Feeding</h1>
						<p className="text-gray-600 text-sm">{pet?.name || "Pet"}</p>
					</div>
				</div>

				{/* Schedule Info */}
				<div className="mb-6 rounded-lg bg-blue-50 p-4">
					<div className="mb-2 flex items-center gap-2">
						<Coffee className="text-blue-600" size={20} />
						<h3 className="font-semibold text-blue-900">{schedule.foodType}</h3>
						{schedule.amount && (
							<span className="text-blue-700 text-sm">
								({schedule.amount}
								{schedule.unit ? ` ${schedule.unit}` : ""})
							</span>
						)}
					</div>

					{/* Feeding Times */}
					<div className="flex items-center gap-2 text-blue-700 text-sm">
						<Clock size={16} />
						<span>
							{(() => {
								try {
									const times = JSON.parse(schedule.times) as string[];
									return times
										.map((time) => {
											const [hours, minutes] = time.split(":");
											if (!hours || !minutes) return time;
											const hour = Number.parseInt(hours);
											const ampm = hour >= 12 ? "PM" : "AM";
											const displayHour = hour % 12 || 12;
											return `${displayHour}:${minutes} ${ampm}`;
										})
										.join(", ");
								} catch {
									return "Invalid schedule";
								}
							})()}
						</span>
					</div>

					{schedule.instructions && (
						<p className="mt-2 text-blue-700 text-sm">
							{schedule.instructions}
						</p>
					)}
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Status Selection */}
					<div>
						<label className="mb-3 block font-medium text-gray-700 text-sm">
							Feeding Status *
						</label>
						<div className="space-y-3">
							{(["fed", "missed", "skipped"] as const).map((status) => {
								const statusInfo = getStatusInfo(status);
								return (
									<label
										key={status}
										className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 border-gray-200 p-4 transition-all ${
											formData.status === status
												? `${statusInfo.border} ${statusInfo.bg}`
												: "hover:border-gray-300"
										}`}
									>
										<input
											type="radio"
											name="status"
											value={status}
											checked={formData.status === status}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													status: e.target.value as typeof prev.status,
												}))
											}
											className="sr-only"
										/>
										<div
											className={
												formData.status === status
													? statusInfo.color
													: "text-gray-500"
											}
										>
											{statusInfo.icon}
										</div>
										<div className="flex-1">
											<div
												className={`font-medium ${formData.status === status ? statusInfo.color : "text-gray-900"}`}
											>
												{statusInfo.label}
											</div>
											<div className="text-gray-600 text-sm">
												{statusInfo.description}
											</div>
										</div>
									</label>
								);
							})}
						</div>
					</div>

					{/* Actual Time */}
					<div>
						<label className="mb-2 block font-medium text-gray-700 text-sm">
							Time *
						</label>
						<div className="relative">
							<Clock
								className="-translate-y-1/2 absolute top-1/2 left-3 transform text-gray-400"
								size={16}
							/>
							<input
								type="time"
								value={formData.actualTime}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										actualTime: e.target.value,
									}))
								}
								className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
								required
							/>
						</div>
					</div>

					{/* Notes */}
					<div>
						<label className="mb-2 block font-medium text-gray-700 text-sm">
							Notes (Optional)
						</label>
						<div className="relative">
							<FileText
								className="absolute top-3 left-3 text-gray-400"
								size={16}
							/>
							<textarea
								value={formData.notes}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, notes: e.target.value }))
								}
								placeholder="Any additional notes about this feeding..."
								rows={3}
								className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
							/>
						</div>
					</div>

					{/* Submit Button */}
					<div className="flex gap-3">
						<button
							type="button"
							onClick={() => router.back()}
							className="flex-1 rounded-lg bg-gray-100 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={logFeedingMutation.isPending}
							className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
						>
							{logFeedingMutation.isPending ? (
								"Logging..."
							) : (
								<>
									<Save size={16} />
									Log Feeding
								</>
							)}
						</button>
					</div>

					{/* Error Message */}
					{logFeedingMutation.error && (
						<div className="rounded-lg border border-red-200 bg-red-50 p-4">
							<div className="flex items-start gap-2">
								<AlertCircle size={16} className="mt-0.5 text-red-600" />
								<div>
									<p className="font-medium text-red-800 text-sm">
										Failed to log feeding
									</p>
									<p className="mt-1 text-red-700 text-sm">
										{logFeedingMutation.error.message}
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
