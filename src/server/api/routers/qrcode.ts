import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const qrCodeRouter = createTRPCRouter({
  // Get pet info by QR code ID (public for QR code scanning)
  getPetByQrCode: publicProcedure
    .input(z.object({ qrCodeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const pet = await ctx.db.pet.findUnique({
        where: { qrCodeId: input.qrCodeId },
        select: {
          id: true,
          name: true,
          species: true,
          breed: true,
          qrCodeId: true,
          userPets: {
            select: {
              user: {
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

      if (!pet) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pet not found with this QR code",
        });
      }

      return pet;
    }),

  // Get today's medication schedule by QR code (public for emergency access)
  getTodayScheduleByQrCode: publicProcedure
    .input(z.object({ qrCodeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const pet = await ctx.db.pet.findUnique({
        where: { qrCodeId: input.qrCodeId },
      });

      if (!pet) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pet not found with this QR code",
        });
      }

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      // Get all active medications for this pet
      const medications = await ctx.db.medication.findMany({
        where: { 
          petId: pet.id,
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
          const daysOfWeek = schedule.daysOfWeek ? JSON.parse(schedule.daysOfWeek) as number[] : null;
          
          // Check if today is a scheduled day
          const todayDayOfWeek = today.getDay();
          const shouldGiveToday = !daysOfWeek || daysOfWeek.includes(todayDayOfWeek);
          
          if (shouldGiveToday) {
            for (const time of times) {
              const [hours, minutes] = time.split(':').map(Number);
              const scheduledDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
              
              // Check if this dose has been logged
              const log = medication.logs.find(log => 
                Math.abs(log.scheduledTime.getTime() - scheduledDateTime.getTime()) < 60000 // Within 1 minute
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

      return {
        pet: {
          id: pet.id,
          name: pet.name,
          species: pet.species,
          breed: pet.breed,
        },
        schedule: todaySchedule.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime()),
      };
    }),

  // Generate new QR code for pet (protected)
  regenerateQrCode: protectedProcedure
    .input(z.object({ petId: z.string() }))
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

      // Generate new QR code ID
      const newQrCodeId = crypto.randomUUID();

      const updatedPet = await ctx.db.pet.update({
        where: { id: input.petId },
        data: { qrCodeId: newQrCodeId },
      });

      return { qrCodeId: updatedPet.qrCodeId };
    }),

  // Log dose via QR code (public - no auth required for emergency access)
  logDoseByQrCode: publicProcedure
    .input(z.object({
      qrCodeId: z.string(),
      medicationId: z.string(),
      status: z.enum(["given", "missed", "skipped"]),
      caregiverName: z.string().min(1).max(100), // Emergency caregiver name
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Find pet by QR code
      const pet = await ctx.db.pet.findFirst({
        where: { qrCodeId: input.qrCodeId },
        include: {
          medications: {
            where: { id: input.medicationId },
          },
        },
      });

      if (!pet) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pet not found with this QR code",
        });
      }

      const medication = pet.medications[0];
      if (!medication) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Medication not found for this pet",
        });
      }

      // Create medication log with emergency caregiver info
      const log = await ctx.db.medicationLog.create({
        data: {
          medicationId: input.medicationId,
          scheduledTime: new Date(), // Current time as scheduled time
          actualTime: new Date(),
          status: input.status,
          notes: input.notes ? `[Emergency Caregiver: ${input.caregiverName}] ${input.notes}` : `[Emergency Caregiver: ${input.caregiverName}]`,
          // Note: givenByUserId is null for emergency logs
        },
      });

      return { success: true, logId: log.id };
    }),
});
