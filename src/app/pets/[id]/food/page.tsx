"use client";

import {
	ArrowLeft,
	CheckCircle,
	Clock,
	Coffee,
	Edit,
	History,
	LogIn,
	Minus,
	MoreVertical,
	Plus,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import MobileLayout from "@/components/MobileLayout";
import { api } from "@/trpc/react";

interface FoodSchedulePageProps {
	params: Promise<{ id: string }>;
}

export default function FoodSchedulePage({ params }: FoodSchedulePageProps) {
	const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(
		null,
	);
	const [activeMenu, setActiveMenu] = useState<string | null>(null);
	const router = useRouter();

	// Resolve params
	useEffect(() => {
		params.then(setResolvedParams);
	}, [params]);

	const { data: pet } = api.pet.getById.useQuery(
		{ id: resolvedParams?.id ?? "" },
		{ enabled: !!resolvedParams?.id },
	);

	const { data: foodSchedules = [], refetch } = api.food.getByPet.useQuery(
		{ petId: resolvedParams?.id ?? "" },
		{ enabled: !!resolvedParams?.id },
	);

	const { data: todaySchedule = [] } = api.food.getTodaySchedule.useQuery(
		{ petId: resolvedParams?.id ?? "" },
		{ enabled: !!resolvedParams?.id },
	);

	const logFeedingMutation = api.food.logFeeding.useMutation({
		onSuccess: () => {
			toast.success("Feeding logged successfully!");
			refetch();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const formatTime = (timeString: string) => {
		const [hours, minutes] = timeString.split(":");
		if (!hours || !minutes) return timeString;
		const hour = Number.parseInt(hours);
		const ampm = hour >= 12 ? "PM" : "AM";
		const displayHour = hour % 12 || 12;
		return `${displayHour}:${minutes} ${ampm}`;
	};

	const formatTimes = (timesJson: string) => {
		try {
			const times = JSON.parse(timesJson) as string[];
			return times.map(formatTime).join(", ");
		} catch {
			return "Invalid schedule";
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "fed":
				return "text-green-600 bg-green-50";
			case "missed":
				return "text-red-600 bg-red-50";
			case "skipped":
				return "text-yellow-600 bg-yellow-50";
			default:
				return "text-blue-600 bg-blue-50";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "fed":
				return <CheckCircle size={16} />;
			case "missed":
				return <XCircle size={16} />;
			case "skipped":
				return <Minus size={16} />;
			default:
				return <Clock size={16} />;
		}
	};

	const handleQuickLog = (
		scheduleId: string,
		status: "fed" | "missed" | "skipped",
	) => {
		logFeedingMutation.mutate({
			scheduleId,
			status,
			actualTime: new Date(),
		});
	};

	if (!resolvedParams?.id) {
		return (
			<MobileLayout>
				<div className="p-4">
					<div className="animate-pulse">
						<div className="mb-4 h-8 w-48 rounded bg-gray-200" />
						<div className="space-y-4">
							{[1, 2, 3].map((i) => (
								<div key={i} className="h-24 rounded bg-gray-200" />
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
				<div className="mb-6 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={() => router.back()}
							className="rounded-lg p-2 transition-colors hover:bg-gray-100"
						>
							<ArrowLeft size={20} />
						</button>
						<div>
							<h1 className="font-bold text-gray-900 text-xl">
								Food Schedules
							</h1>
							<p className="text-gray-600 text-sm">{pet?.name || "Pet"}</p>
						</div>
					</div>
					<button
						type="button"
						onClick={() => router.push(`/pets/${resolvedParams.id}/food/new`)}
						className="rounded-lg bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700"
					>
						<Plus size={20} />
					</button>
				</div>

				{/* Today's Schedule Summary */}
				{todaySchedule.length > 0 && (
					<div className="mb-6">
						<h2 className="mb-3 font-semibold text-gray-900 text-lg">
							Today's Feeding Schedule
						</h2>
						<div className="space-y-2">
							{todaySchedule.map((item, index) => (
								<div
									key={`${item.scheduleId}-${index}`}
									className="rounded-lg border border-gray-200 bg-white p-4"
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<div
												className={`rounded-full p-2 ${getStatusColor(item.status)}`}
											>
												{getStatusIcon(item.status)}
											</div>
											<div>
												<div className="font-medium text-gray-900">
													{item.foodType}{" "}
													{item.amount &&
														`(${item.amount}${item.unit ? ` ${item.unit}` : ""})`}
												</div>
												<div className="text-gray-600 text-sm">
													{formatTime(
														item.scheduledTime.toTimeString().slice(0, 5),
													)}
													{item.fedBy && (
														<span className="ml-2">
															• Fed by {item.fedBy.name}
														</span>
													)}
												</div>
											</div>
										</div>

										{item.status === "pending" && (
											<div className="flex gap-2">
												<button
													type="button"
													onClick={() => handleQuickLog(item.scheduleId, "fed")}
													disabled={logFeedingMutation.isPending}
													className="rounded-md bg-green-600 px-3 py-1 text-sm text-white transition-colors hover:bg-green-700 disabled:opacity-50"
												>
													Fed
												</button>
												<button
													type="button"
													onClick={() =>
														handleQuickLog(item.scheduleId, "missed")
													}
													disabled={logFeedingMutation.isPending}
													className="rounded-md bg-red-600 px-3 py-1 text-sm text-white transition-colors hover:bg-red-700 disabled:opacity-50"
												>
													Missed
												</button>
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Food Schedules */}
				<div className="mb-6">
					<h2 className="mb-3 font-semibold text-gray-900 text-lg">
						All Food Schedules
					</h2>

					{foodSchedules.length === 0 ? (
						<div className="py-12 text-center">
							<Coffee className="mx-auto mb-4 text-gray-400" size={48} />
							<h3 className="mb-2 font-medium text-gray-900 text-lg">
								No food schedules yet
							</h3>
							<p className="mb-6 text-gray-600">
								Create a feeding schedule to help track your pet's meals
							</p>
							<button
								type="button"
								onClick={() =>
									router.push(`/pets/${resolvedParams.id}/food/new`)
								}
								className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
							>
								Add First Schedule
							</button>
						</div>
					) : (
						<div className="space-y-4">
							{foodSchedules.map((schedule) => (
								<div
									key={schedule.id}
									className="rounded-lg border border-gray-200 bg-white p-4"
								>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="mb-2 flex items-center gap-2">
												<Coffee className="text-blue-600" size={20} />
												<h3 className="font-semibold text-gray-900">
													{schedule.foodType}
												</h3>
												{schedule.amount && (
													<span className="text-gray-600 text-sm">
														({schedule.amount}
														{schedule.unit ? ` ${schedule.unit}` : ""})
													</span>
												)}
											</div>

											<div className="mb-2 flex items-center gap-2 text-gray-600 text-sm">
												<Clock size={16} />
												<span>{formatTimes(schedule.times)}</span>
											</div>

											{schedule.instructions && (
												<p className="mb-3 text-gray-600 text-sm">
													{schedule.instructions}
												</p>
											)}

											{/* Recent Logs */}
											{schedule.logs && schedule.logs.length > 0 && (
												<div className="flex items-center gap-4 text-gray-500 text-xs">
													<span>
														Recent: {schedule.logs[0]?.status || "No logs"}
													</span>
													{schedule.logs[0]?.actualTime && (
														<span>
															{new Date(
																schedule.logs[0].actualTime,
															).toLocaleDateString()}
														</span>
													)}
												</div>
											)}
										</div>

										<div className="relative">
											<button
												type="button"
												onClick={() =>
													setActiveMenu(
														activeMenu === schedule.id ? null : schedule.id,
													)
												}
												className="rounded-lg p-2 transition-colors hover:bg-gray-100"
											>
												<MoreVertical size={16} />
											</button>

											{activeMenu === schedule.id && (
												<div className="absolute top-full right-0 z-10 mt-1 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
													<button
														type="button"
														onClick={() => {
															router.push(
																`/pets/${resolvedParams.id}/food/${schedule.id}/log`,
															);
															setActiveMenu(null);
														}}
														className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50"
													>
														<LogIn size={16} />
														Log Feeding
													</button>
													<button
														type="button"
														onClick={() => {
															router.push(
																`/pets/${resolvedParams.id}/food/${schedule.id}/edit`,
															);
															setActiveMenu(null);
														}}
														className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50"
													>
														<Edit size={16} />
														Edit Schedule
													</button>
													<button
														type="button"
														onClick={() => {
															router.push(
																`/pets/${resolvedParams.id}/food/${schedule.id}/history`,
															);
															setActiveMenu(null);
														}}
														className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50"
													>
														<History size={16} />
														View History
													</button>
												</div>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</MobileLayout>
	);
}
