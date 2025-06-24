import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const petRouter = createTRPCRouter({
  // Get all pets for the current user
  getMyPets: protectedProcedure.query(async ({ ctx }) => {
    const userPets = await ctx.db.userPet.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        pet: {
          include: {
            medications: {
              where: { isActive: true },
              include: {
                schedules: {
                  where: { isActive: true },
                },
                logs: {
                  orderBy: { createdAt: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    return userPets.map(up => up.pet);
  }),

  // Get a specific pet by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if user has access to this pet
      const userPet = await ctx.db.userPet.findFirst({
        where: {
          userId: ctx.session.user.id,
          petId: input.id,
        },
      });

      if (!userPet) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this pet",
        });
      }

      const pet = await ctx.db.pet.findUnique({
        where: { id: input.id },
        include: {
          medications: {
            where: { isActive: true },
            include: {
              schedules: {
                where: { isActive: true },
              },
              logs: {
                orderBy: { createdAt: "desc" },
                take: 5,
              },
            },
          },
          userPets: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      return pet;
    }),

  // Create a new pet
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(50),
      species: z.string().optional(),
      breed: z.string().optional(),
      birthDate: z.date().optional(),
      weight: z.number().positive().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const pet = await ctx.db.pet.create({
        data: {
          ...input,
          userPets: {
            create: {
              userId: ctx.session.user.id,
              role: "owner",
            },
          },
        },
      });

      return pet;
    }),

  // Update pet information
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(50).optional(),
      species: z.string().optional(),
      breed: z.string().optional(),
      birthDate: z.date().optional(),
      weight: z.number().positive().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user has access to this pet
      const userPet = await ctx.db.userPet.findFirst({
        where: {
          userId: ctx.session.user.id,
          petId: input.id,
        },
      });

      if (!userPet) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this pet",
        });
      }

      const { id, ...updateData } = input;
      const pet = await ctx.db.pet.update({
        where: { id },
        data: updateData,
      });

      return pet;
    }),

  // Add a caregiver to a pet
  addCaregiver: protectedProcedure
    .input(z.object({
      petId: z.string(),
      email: z.string().email(),
      role: z.enum(["owner", "caregiver"]).default("caregiver"),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if current user has access to this pet
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

      // Find the user to add as caregiver
      const targetUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found with that email",
        });
      }

      // Check if user is already a caregiver
      const existingCaregiver = await ctx.db.userPet.findFirst({
        where: {
          userId: targetUser.id,
          petId: input.petId,
        },
      });

      if (existingCaregiver) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User is already a caregiver for this pet",
        });
      }

      // Add caregiver
      const newCaregiver = await ctx.db.userPet.create({
        data: {
          userId: targetUser.id,
          petId: input.petId,
          role: input.role,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      return newCaregiver;
    }),

  // Remove a caregiver from a pet
  removeCaregiver: protectedProcedure
    .input(z.object({
      petId: z.string(),
      userId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if current user has access to this pet
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

      // Don't allow removing the last owner
      if (input.userId === ctx.session.user.id) {
        const ownerCount = await ctx.db.userPet.count({
          where: {
            petId: input.petId,
            role: "owner",
          },
        });

        if (ownerCount <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot remove the last owner of a pet",
          });
        }
      }

      await ctx.db.userPet.delete({
        where: {
          userId_petId: {
            userId: input.userId,
            petId: input.petId,
          },
        },
      });

      return { success: true };
    }),
});
