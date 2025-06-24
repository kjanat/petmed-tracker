"use client";

import { ArrowLeft, Heart, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MobileLayout from "@/components/MobileLayout";
import { api } from "@/trpc/react";

export default function AddPetPage() {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const createPet = api.pet.create.useMutation({
		onSuccess: () => {
			router.push("/pets");
		},
		onError: (error) => {
			console.error("Failed to create pet:", error);
			alert("Failed to create pet. Please try again.");
		},
	});

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);

		const formData = new FormData(e.currentTarget);
		const data = {
			name: formData.get("name") as string,
			species: (formData.get("species") as string) || undefined,
			breed: (formData.get("breed") as string) || undefined,
			birthDate: formData.get("birthDate")
				? new Date(formData.get("birthDate") as string)
				: undefined,
			weight: formData.get("weight")
				? Number.parseFloat(formData.get("weight") as string)
				: undefined,
			notes: (formData.get("notes") as string) || undefined,
		};

		try {
			await createPet.mutateAsync(data);
		} catch (error) {
			console.error("Error creating pet:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<MobileLayout activeTab="pets">
			<div className="px-4 py-6">
				{/* Header */}
				<div className="mb-6 flex items-center gap-3">
					<Link
						href="/pets"
						className="rounded-lg p-2 transition-colors hover:bg-gray-100"
					>
						<ArrowLeft size={20} className="text-gray-600" />
					</Link>
					<h1 className="font-bold text-2xl text-gray-900">Add New Pet</h1>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
						<div className="mb-6 flex items-center gap-3">
							<div className="rounded-full bg-blue-100 p-3">
								<Heart className="text-blue-600" size={24} />
							</div>
							<div>
								<h2 className="font-semibold text-gray-900 text-lg">
									Pet Information
								</h2>
								<p className="text-gray-600 text-sm">
									Tell us about your furry friend
								</p>
							</div>
						</div>

						<div className="space-y-4">
							{/* Pet Name - Required */}
							<div>
								<label
									htmlFor="name"
									className="mb-2 block font-medium text-gray-700 text-sm"
								>
									Pet Name *
								</label>
								<input
									type="text"
									id="name"
									name="name"
									required
									maxLength={50}
									className="w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
									placeholder="e.g., Fluffy, Max, Luna"
								/>
							</div>

							{/* Species */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label
										htmlFor="species"
										className="mb-2 block font-medium text-gray-700 text-sm"
									>
										Species
									</label>
									<select
										id="species"
										name="species"
										className="w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
									>
										<option value="">Select species</option>
										<option value="Dog">Dog</option>
										<option value="Cat">Cat</option>
										<option value="Bird">Bird</option>
										<option value="Rabbit">Rabbit</option>
										<option value="Hamster">Hamster</option>
										<option value="Guinea Pig">Guinea Pig</option>
										<option value="Reptile">Reptile</option>
										<option value="Fish">Fish</option>
										<option value="Other">Other</option>
									</select>
								</div>

								<div>
									<label
										htmlFor="breed"
										className="mb-2 block font-medium text-gray-700 text-sm"
									>
										Breed
									</label>
									<input
										type="text"
										id="breed"
										name="breed"
										className="w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
										placeholder="e.g., Golden Retriever"
									/>
								</div>
							</div>

							{/* Birth Date & Weight */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label
										htmlFor="birthDate"
										className="mb-2 block font-medium text-gray-700 text-sm"
									>
										Birth Date
									</label>
									<input
										type="date"
										id="birthDate"
										name="birthDate"
										className="w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
									/>
								</div>

								<div>
									<label
										htmlFor="weight"
										className="mb-2 block font-medium text-gray-700 text-sm"
									>
										Weight (lbs)
									</label>
									<input
										type="number"
										id="weight"
										name="weight"
										step="0.1"
										min="0.1"
										className="w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
										placeholder="e.g., 12.5"
									/>
								</div>
							</div>

							{/* Notes */}
							<div>
								<label
									htmlFor="notes"
									className="mb-2 block font-medium text-gray-700 text-sm"
								>
									Notes
								</label>
								<textarea
									id="notes"
									name="notes"
									rows={3}
									className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
									placeholder="Any special notes about your pet..."
								/>
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3">
						<Link
							href="/pets"
							className="flex-1 rounded-lg bg-gray-100 px-4 py-3 text-center font-medium text-gray-700 transition-colors hover:bg-gray-200"
						>
							Cancel
						</Link>
						<button
							type="submit"
							disabled={isSubmitting}
							className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isSubmitting ? (
								<>
									<div className="h-4 w-4 animate-spin rounded-full border-white border-b-2" />
									Creating...
								</>
							) : (
								<>
									<Plus size={16} />
									Add Pet
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</MobileLayout>
	);
}
