"use client";

import {
	AlertCircle,
	ArrowLeft,
	CheckCircle,
	Clock,
	Coffee,
	Plus,
	Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { toast } from "react-hot-toast";
import MobileLayout from "@/components/MobileLayout";
import { api } from "@/trpc/react";

interface NewFoodSchedulePageProps {
	params: Promise<{ id: string }>;
}

const FOOD_TYPE_SUGGESTIONS = [
	"Dry Kibble",
	"Wet Food",
	"Raw Food",
	"Treats",
	"Supplements",
	"Prescription Diet",
	"Puppy Food",
	"Senior Food",
	"Weight Management",
	"Dental Chews",
];

const UNIT_OPTIONS = [
	"cups",
	"grams",
	"oz",
	"lbs",
	"pieces",
	"scoops",
	"tbsp",
	"tsp",
	"ml",
];

function generateId() {
	return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function NewFoodSchedulePage({
	params,
}: NewFoodSchedulePageProps) {
	const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(
		null,
	);
	const [formData, setFormData] = useState({
		foodType: "",
		amount: "",
		unit: "",
		times: [""],
		instructions: "",
	});
	const [showSuggestions, setShowSuggestions] = useState(false);
	const router = useRouter();

	// Resolve params
	useEffect(() => {
		params.then(setResolvedParams);
	}, [params]);

	const { data: pet } = api.pet.getById.useQuery(
		{ id: resolvedParams?.id ?? "" },
		{ enabled: !!resolvedParams?.id },
	);

	const createFoodScheduleMutation = api.food.create.useMutation({
		onSuccess: () => {
			toast.success("Food schedule created successfully!");
			router.push(`/pets/${resolvedParams?.id}/food`);
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const foodTypeId = useId();
	const amountId = useId();
	const unitId = useId();
	const instructionsId = useId();
	const feedingTimesLabelId = useId();
	// Feeding times: store array of { id, value }
	const [feedingTimes, setFeedingTimes] = useState([
		{ id: generateId(), value: "" },
	]);

	const addTimeSlot = () => {
		setFeedingTimes((prev) => [...prev, { id: generateId(), value: "" }]);
	};
	const removeTimeSlot = (index: number) => {
		if (feedingTimes.length > 1) {
			setFeedingTimes((prev) => prev.filter((_, i) => i !== index));
		}
	};
	const updateTimeSlot = (index: number, value: string) => {
		setFeedingTimes((prev) =>
			prev.map((slot, i) => (i === index ? { ...slot, value } : slot)),
		);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!resolvedParams?.id) return;

		// Validation
		if (!formData.foodType.trim()) {
			toast.error("Please enter a food type");
			return;
		}

		const validTimes = feedingTimes
			.map((slot) => slot.value)
			.filter((time) => time.trim() !== "");
		if (validTimes.length === 0) {
			toast.error("Please add at least one feeding time");
			return;
		}

		// Validate time format
		const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
		const invalidTimes = validTimes.filter((time) => !timeRegex.test(time));
		if (invalidTimes.length > 0) {
			toast.error("Please use valid time format (HH:MM)");
			return;
		}

		createFoodScheduleMutation.mutate({
			petId: resolvedParams.id,
			foodType: formData.foodType.trim(),
			amount: formData.amount.trim() || undefined,
			unit: formData.unit.trim() || undefined,
			times: validTimes,
			instructions: formData.instructions.trim() || undefined,
		});
	};

	const filteredSuggestions = FOOD_TYPE_SUGGESTIONS.filter((suggestion) =>
		suggestion.toLowerCase().includes(formData.foodType.toLowerCase()),
	);

	if (!resolvedParams?.id) {
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
						type="button"
						onClick={() => router.back()}
						className="rounded-lg p-2 transition-colors hover:bg-gray-100"
					>
						<ArrowLeft size={20} />
					</button>
					<div>
						<h1 className="font-bold text-gray-900 text-xl">
							Add Food Schedule
						</h1>
						<p className="text-gray-600 text-sm">{pet?.name || "Pet"}</p>
					</div>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Food Type */}
					<div className="relative">
						<label
							htmlFor={foodTypeId}
							className="mb-2 block font-medium text-gray-700 text-sm"
						>
							Food Type *
						</label>
						<div className="relative">
							<Coffee
								className="-translate-y-1/2 absolute top-1/2 left-3 transform text-gray-400"
								size={16}
							/>
							<input
								id={foodTypeId}
								type="text"
								value={formData.foodType}
								onChange={(e) => {
									setFormData((prev) => ({
										...prev,
										foodType: e.target.value,
									}));
									setShowSuggestions(true);
								}}
								onFocus={() => setShowSuggestions(true)}
								onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
								placeholder="Enter food type (e.g., Dry Kibble, Wet Food)"
								className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
								required
							/>
						</div>

						{/* Suggestions */}
						{showSuggestions &&
							formData.foodType &&
							filteredSuggestions.length > 0 && (
								<div className="absolute top-full right-0 left-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
									{filteredSuggestions.map((suggestion) => (
										<button
											key={suggestion}
											type="button"
											onClick={() => {
												setFormData((prev) => ({
													...prev,
													foodType: suggestion,
												}));
												setShowSuggestions(false);
											}}
											className="w-full border-gray-100 border-b px-4 py-2 text-left last:border-b-0 hover:bg-gray-50"
										>
											{suggestion}
										</button>
									))}
								</div>
							)}
					</div>

					{/* Amount & Unit */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label
								htmlFor={amountId}
								className="mb-2 block font-medium text-gray-700 text-sm"
							>
								Amount
							</label>
							<input
								id={amountId}
								type="text"
								value={formData.amount}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, amount: e.target.value }))
								}
								placeholder="1.5"
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

					{/* Feeding Times */}
					<div>
						<div className="mb-2 flex items-center justify-between">
							<label
								htmlFor={feedingTimes?.[0]?.id}
								className="block font-medium text-gray-700 text-sm"
							>
								Feeding Times *
							</label>
							<button
								type="button"
								onClick={addTimeSlot}
								className="flex items-center gap-1 text-blue-600 text-sm hover:text-blue-700"
							>
								<Plus size={16} />
								Add Time
							</button>
						</div>
						<div className="space-y-3">
							{feedingTimes.map((slot, index) => (
								<div key={slot.id} className="flex items-center gap-2">
									<div className="relative flex-1">
										<Clock
											className="-translate-y-1/2 absolute top-1/2 left-3 transform text-gray-400"
											size={16}
										/>
										<input
											id={slot.id}
											type="time"
											value={slot.value}
											onChange={(e) => updateTimeSlot(index, e.target.value)}
											aria-labelledby={feedingTimesLabelId}
											className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
											required
										/>
									</div>
									{feedingTimes.length > 1 && (
										<button
											type="button"
											onClick={() => removeTimeSlot(index)}
											className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
										>
											<Trash2 size={16} />
										</button>
									)}
								</div>
							))}
						</div>
					</div>

					{/* Instructions */}
					<div>
						<label
							htmlFor={instructionsId}
							className="mb-2 block font-medium text-gray-700 text-sm"
						>
							Instructions / Notes
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
							placeholder="Special feeding instructions, location, etc."
							rows={3}
							className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
						/>
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
							disabled={createFoodScheduleMutation.isPending}
							className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
						>
							{createFoodScheduleMutation.isPending ? (
								"Creating..."
							) : (
								<>
									<CheckCircle size={16} />
									Create Schedule
								</>
							)}
						</button>
					</div>

					{/* Error Message */}
					{createFoodScheduleMutation.error && (
						<div className="rounded-lg border border-red-200 bg-red-50 p-4">
							<div className="flex items-start gap-2">
								<AlertCircle size={16} className="mt-0.5 text-red-600" />
								<div>
									<p className="font-medium text-red-800 text-sm">
										Failed to create food schedule
									</p>
									<p className="mt-1 text-red-700 text-sm">
										{createFoodScheduleMutation.error.message}
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
