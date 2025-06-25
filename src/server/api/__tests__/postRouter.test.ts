import type { PrismaClient } from "@prisma/client";
import { expect, test, vi } from "vitest";
import { createCaller } from "../root";

vi.mock("@/server/auth", () => ({
	auth: vi.fn().mockResolvedValue(null),
}));

const caller = createCaller({
	db: {} as unknown as PrismaClient,
	session: null,
	headers: new Headers(),
});

test("hello procedure returns greeting", async () => {
	const res = await caller.post.hello({ text: "Vitest" });
	expect(res.greeting).toBe("Hello Vitest");
});
