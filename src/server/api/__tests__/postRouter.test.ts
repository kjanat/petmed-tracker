import type { PrismaClient } from "@prisma/client";
import { createCaller } from "../root";

const caller = createCaller({
	db: {} as unknown as PrismaClient,
	session: null,
	headers: new Headers(),
});

test("hello procedure returns greeting", async () => {
	const res = await caller.post.hello({ text: "Vitest" });
	expect(res.greeting).toBe("Hello Vitest");
});
