import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import MobileLayout from "../MobileLayout";

vi.mock("next-auth/react", () => ({
	useSession: () => ({ data: { user: { id: "1" } }, status: "authenticated" }),
}));

it("renders header title", () => {
	render(
		<MobileLayout>
			<div>content</div>
		</MobileLayout>,
	);
	expect(screen.getByText("PetMed Tracker")).toBeInTheDocument();
});
