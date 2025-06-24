import { postRouter } from "@/server/api/routers/post";
import { petRouter } from "@/server/api/routers/pet";
import { medicationRouter } from "@/server/api/routers/medication";
import { qrCodeRouter } from "@/server/api/routers/qrcode";
import { foodRouter } from "@/server/api/routers/food";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	post: postRouter,
	pet: petRouter,
	medication: medicationRouter,
	qrCode: qrCodeRouter,
	food: foodRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
