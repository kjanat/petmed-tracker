import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const medicationRouter = createTRPCRouter({
	// Get all medications for a specific pet
	getByPet: protectedProcedure
		.input(z.object({ petId: z.string() }))
		.query(async ({ ctx, input }) => {
			// Check if user has access to this pet
			const userPet = await ctx.db.userPet.findFirst({
				where: {
					userId: ctx.session.user.id,
					petId: input.petId,
				},
			});

			if (!userPet) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have access to this pet",
				});
			}

			return await ctx.db.medication.findMany({
				where: {
					petId: input.petId,
					isActive: true,
				},
				include: {
					schedules: {
						where: { isActive: true },
					},
					logs: {
						orderBy: { createdAt: "desc" },
						take: 10,
						include: {
							givenBy: {
								select: {
									id: true,
									name: true,
									email: true,
								},
							},
						},
					},
				},
			});
		}),

	// Create a new medication
	create: protectedProcedure
		.input(
			z.object({
				petId: z.string(),
				name: z.string().min(1).max(100),
				dosage: z.string().optional(),
				unit: z.string().optional(),
				instructions: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check if user has access to this pet
			const userPet = await ctx.db.userPet.findFirst({
				where: {
					userId: ctx.session.user.id,
					petId: input.petId,
				},
			});

			if (!userPet) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have access to this pet",
				});
			}

			return await ctx.db.medication.create({
				data: input,
			});
		}),

	// Update medication
	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).max(100).optional(),
				dosage: z.string().optional(),
				unit: z.string().optional(),
				instructions: z.string().optional(),
				isActive: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check if user has access to this medication's pet
			const medication = await ctx.db.medication.findUnique({
				where: { id: input.id },
				include: { pet: { include: { userPets: true } } },
			});

			if (!medication) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Medication not found",
				});
			}

			const userHasAccess = medication.pet.userPets.some(
				(up) => up.userId === ctx.session.user.id,
			);

			if (!userHasAccess) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have access to this medication",
				});
			}

			const { id, ...updateData } = input;
			return await ctx.db.medication.update({
				where: { id },
				data: updateData,
			});
		}),

	// Create a medication schedule
	createSchedule: protectedProcedure
		.input(
			z.object({
				medicationId: z.string(),
				scheduleType: z.enum(["daily", "weekly", "custom"]),
				times: z.array(z.string()), // ["08:00", "20:00"]
				daysOfWeek: z.array(z.number().min(0).max(6)).optional(), // [1,2,3,4,5] for Mon-Fri
				startDate: z.date().optional(),
				endDate: z.date().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check if user has access to this medication
			const medication = await ctx.db.medication.findUnique({
				where: { id: input.medicationId },
				include: { pet: { include: { userPets: true } } },
			});

			if (!medication) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Medication not found",
				});
			}

			const userHasAccess = medication.pet.userPets.some(
				(up) => up.userId === ctx.session.user.id,
			);

			if (!userHasAccess) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have access to this medication",
				});
			}

			return await ctx.db.medicationSchedule.create({
				data: {
					medicationId: input.medicationId,
					scheduleType: input.scheduleType,
					times: JSON.stringify(input.times),
					daysOfWeek: input.daysOfWeek
						? JSON.stringify(input.daysOfWeek)
						: null,
					startDate: input.startDate ?? new Date(),
					endDate: input.endDate,
				},
			});
		}),

	// Log medication given
	logMedication: protectedProcedure
		.input(
			z.object({
				medicationId: z.string(),
				scheduledTime: z.date(),
				actualTime: z.date().optional(),
				notes: z.string().optional(),
				status: z.enum(["given", "missed", "skipped"]).default("given"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check if user has access to this medication
			const medication = await ctx.db.medication.findUnique({
				where: { id: input.medicationId },
				include: { pet: { include: { userPets: true } } },
			});

			if (!medication) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Medication not found",
				});
			}

			const userHasAccess = medication.pet.userPets.some(
				(up) => up.userId === ctx.session.user.id,
			);

			if (!userHasAccess) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have access to this medication",
				});
			}

			return await ctx.db.medicationLog.create({
				data: {
					medicationId: input.medicationId,
					scheduledTime: input.scheduledTime,
					actualTime: input.actualTime ?? new Date(),
					givenByUserId: ctx.session.user.id,
					notes: input.notes,
					status: input.status,
				},
				include: {
					givenBy: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			});
		}),

	// Log a medication dose
	logDose: protectedProcedure
		.input(
			z.object({
				medicationId: z.string(),
				status: z.enum(["given", "missed", "skipped", "pending"]),
				actualTime: z.date().optional(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check if user has access to this medication
			const medication = await ctx.db.medication.findUnique({
				where: { id: input.medicationId },
				include: { pet: { include: { userPets: true } } },
			});

			if (!medication) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Medication not found",
				});
			}

			const userHasAccess = medication.pet.userPets.some(
				(up) => up.userId === ctx.session.user.id,
			);

			if (!userHasAccess) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have access to this medication",
				});
			}

			// Create medication log
			return await ctx.db.medicationLog.create({
				data: {
					medicationId: input.medicationId,
					scheduledTime: input.actualTime || new Date(), // Use actualTime as scheduledTime if provided
					actualTime: input.actualTime,
					givenByUserId: ctx.session.user.id,
					status: input.status,
					notes: input.notes,
				},
				include: {
					givenBy: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			});
		}),

	// Get today's medication schedule for a pet
	getTodaySchedule: protectedProcedure
		.input(z.object({ petId: z.string() }))
		.query(async ({ ctx, input }) => {
			// Check if user has access to this pet
			const userPet = await ctx.db.userPet.findFirst({
				where: {
					userId: ctx.session.user.id,
					petId: input.petId,
				},
			});

			if (!userPet) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have access to this pet",
				});
			}

			const today = new Date();
			const startOfDay = new Date(
				today.getFullYear(),
				today.getMonth(),
				today.getDate(),
			);
			const endOfDay = new Date(
				today.getFullYear(),
				today.getMonth(),
				today.getDate(),
				23,
				59,
				59,
			);

			// Get all active medications for this pet
			const medications = await ctx.db.medication.findMany({
				where: {
					petId: input.petId,
					isActive: true,
				},
				include: {
					schedules: {
						where: { isActive: true },
					},
					logs: {
						where: {
							scheduledTime: {
								gte: startOfDay,
								lte: endOfDay,
							},
						},
						include: {
							givenBy: {
								select: {
									id: true,
									name: true,
									email: true,
								},
							},
						},
					},
				},
			});

			// Transform into today's schedule with status
			const todaySchedule = [];

			for (const medication of medications) {
				for (const schedule of medication.schedules) {
					const times = JSON.parse(schedule.times) as string[];
					const daysOfWeek = schedule.daysOfWeek
						? (JSON.parse(schedule.daysOfWeek) as number[])
						: null;

					// Check if today is a scheduled day
					const todayDayOfWeek = today.getDay();
					const shouldGiveToday =
						!daysOfWeek || daysOfWeek.includes(todayDayOfWeek);

					if (shouldGiveToday) {
						for (const time of times) {
							const [hours, minutes] = time.split(":").map(Number);
							const scheduledDateTime = new Date(
								today.getFullYear(),
								today.getMonth(),
								today.getDate(),
								hours,
								minutes,
							);

							// Check if this dose has been logged
							const log = medication.logs.find(
								(log) =>
									Math.abs(
										log.scheduledTime.getTime() - scheduledDateTime.getTime(),
									) < 60000, // Within 1 minute
							);

							todaySchedule.push({
								medicationId: medication.id,
								medicationName: medication.name,
								dosage: medication.dosage,
								unit: medication.unit,
								instructions: medication.instructions,
								scheduledTime: scheduledDateTime,
								status: log?.status ?? "pending",
								givenBy: log?.givenBy,
								actualTime: log?.actualTime,
								notes: log?.notes,
								logId: log?.id,
							});
						}
					}
				}
			}

			return todaySchedule.sort(
				(a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime(),
			);
		}),

	// Update medication schedule
	updateSchedule: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				scheduleType: z.enum(["daily", "weekly", "custom"]).optional(),
				times: z.array(z.string()).optional(), // ["08:00", "20:00"]
				daysOfWeek: z.array(z.number().min(0).max(6)).optional(), // [1,2,3,4,5] for Mon-Fri
				startDate: z.date().optional(),
				endDate: z.date().optional(),
				isActive: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check if user has access to this schedule's medication
			const schedule = await ctx.db.medicationSchedule.findUnique({
				where: { id: input.id },
				include: {
					medication: {
						include: {
							pet: {
								include: { userPets: true },
							},
						},
					},
				},
			});

			if (!schedule) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Schedule not found",
				});
			}

			const userHasAccess = schedule.medication.pet.userPets.some(
				(up) => up.userId === ctx.session.user.id,
			);

			if (!userHasAccess) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have access to this schedule",
				});
			}

			const { id, ...updateData } = input;
			const processedData: Record<string, unknown> = { ...updateData };

			// Process array fields
			if (updateData.times) {
				processedData.times = JSON.stringify(updateData.times);
			}
			if (updateData.daysOfWeek) {
				processedData.daysOfWeek = JSON.stringify(updateData.daysOfWeek);
			}

			return await ctx.db.medicationSchedule.update({
				where: { id },
				data: processedData,
			});
		}),

	// Delete (deactivate) medication schedule
	deleteSchedule: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			// Check if user has access to this schedule's medication
			const schedule = await ctx.db.medicationSchedule.findUnique({
				where: { id: input.id },
				include: {
					medication: {
						include: {
							pet: {
								include: { userPets: true },
							},
						},
					},
				},
			});

			if (!schedule) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Schedule not found",
				});
			}

			const userHasAccess = schedule.medication.pet.userPets.some(
				(up) => up.userId === ctx.session.user.id,
			);

			if (!userHasAccess) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have access to this schedule",
				});
			}

			// Soft delete by setting isActive to false
			return await ctx.db.medicationSchedule.update({
				where: { id: input.id },
				data: { isActive: false },
			});
		}),
});
