import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const foodRouter = createTRPCRouter({
	// Get all food schedules for a specific pet
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

			return await ctx.db.foodSchedule.findMany({
				where: {
					petId: input.petId,
					isActive: true,
				},
				include: {
					logs: {
						orderBy: { createdAt: "desc" },
						take: 10,
						include: {
							fedBy: {
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

	// Create a new food schedule
	create: protectedProcedure
		.input(
			z.object({
				petId: z.string(),
				foodType: z.string().min(1).max(100),
				amount: z.string().optional(),
				unit: z.string().optional(),
				times: z.array(z.string()), // ["08:00", "18:00"]
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

			return await ctx.db.foodSchedule.create({
				data: {
					petId: input.petId,
					foodType: input.foodType,
					amount: input.amount,
					unit: input.unit,
					times: JSON.stringify(input.times),
					instructions: input.instructions,
				},
			});
		}),

	// Update food schedule
	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				foodType: z.string().min(1).max(100).optional(),
				amount: z.string().optional(),
				unit: z.string().optional(),
				times: z.array(z.string()).optional(),
				instructions: z.string().optional(),
				isActive: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check if user has access to this food schedule's pet
			const schedule = await ctx.db.foodSchedule.findUnique({
				where: { id: input.id },
				include: { pet: { include: { userPets: true } } },
			});

			if (!schedule) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Food schedule not found",
				});
			}

			const userHasAccess = schedule.pet.userPets.some(
				(up) => up.userId === ctx.session.user.id,
			);

			if (!userHasAccess) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have access to this food schedule",
				});
			}

			const { id, times, ...updateData } = input;
			const processedData: Record<string, unknown> = { ...updateData };

			if (times) {
				processedData.times = JSON.stringify(times);
			}

			return await ctx.db.foodSchedule.update({
				where: { id },
				data: processedData,
			});
		}), // Log feeding
	logFeeding: protectedProcedure
		.input(
			z.object({
				scheduleId: z.string(),
				status: z.enum(["fed", "missed", "skipped"]),
				actualTime: z.date().optional(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check if user has access to this food schedule
			const schedule = await ctx.db.foodSchedule.findUnique({
				where: { id: input.scheduleId },
				include: { pet: { include: { userPets: true } } },
			});

			if (!schedule) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Food schedule not found",
				});
			}

			const userHasAccess = schedule.pet.userPets.some(
				(up) => up.userId === ctx.session.user.id,
			);

			if (!userHasAccess) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have access to this food schedule",
				});
			}

			return await ctx.db.foodLog.create({
				data: {
					foodScheduleId: input.scheduleId,
					scheduledTime: input.actualTime || new Date(),
					actualTime: input.actualTime || new Date(),
					fedByUserId: ctx.session.user.id,
					status: input.status,
					notes: input.notes,
				},
				include: {
					fedBy: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			});
		}),

	// Get today's feeding schedule for a pet
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

			// Get all active food schedules for this pet
			const schedules = await ctx.db.foodSchedule.findMany({
				where: {
					petId: input.petId,
					isActive: true,
				},
				include: {
					logs: {
						where: {
							scheduledTime: {
								gte: startOfDay,
								lte: endOfDay,
							},
						},
						include: {
							fedBy: {
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

			for (const schedule of schedules) {
				const times = JSON.parse(schedule.times) as string[];

				for (const time of times) {
					const [hours, minutes] = time.split(":").map(Number);
					const scheduledDateTime = new Date(
						today.getFullYear(),
						today.getMonth(),
						today.getDate(),
						hours,
						minutes,
					);

					// Check if this feeding has been logged
					const log = schedule.logs.find(
						(log) =>
							Math.abs(
								log.scheduledTime.getTime() - scheduledDateTime.getTime(),
							) < 60000, // Within 1 minute
					);

					todaySchedule.push({
						scheduleId: schedule.id,
						foodType: schedule.foodType,
						amount: schedule.amount,
						unit: schedule.unit,
						instructions: schedule.instructions,
						scheduledTime: scheduledDateTime,
						status: log?.status ?? "pending",
						fedBy: log?.fedBy,
						actualTime: log?.actualTime,
						notes: log?.notes,
						logId: log?.id,
					});
				}
			}

			return todaySchedule.sort(
				(a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime(),
			);
		}),
});
