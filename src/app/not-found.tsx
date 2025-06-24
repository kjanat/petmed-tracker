"use client";

import { AlertCircle, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import MobileLayout from "@/components/MobileLayout";

export default function NotFound() {
	return (
		<MobileLayout>
			<div className="px-4 py-8">
				<div className="text-center">
					<AlertCircle className="mx-auto mb-4 text-gray-400" size={64} />
					<h1 className="mb-2 font-bold text-4xl text-gray-900">404</h1>
					<h2 className="mb-4 font-semibold text-gray-700 text-xl">
						Page Not Found
					</h2>
					<p className="mx-auto mb-8 max-w-sm text-gray-600">
						Sorry, we couldn't find the page you're looking for. It might have
						been moved or doesn't exist.
					</p>

					<div className="flex flex-col justify-center gap-3 sm:flex-row">
						<Link
							href="/"
							className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
						>
							<Home size={16} />
							Go Home
						</Link>
						<button
							type="button"
							onClick={() => window.history.back()}
							className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200"
						>
							<ArrowLeft size={16} />
							Go Back
						</button>
					</div>
				</div>
			</div>
		</MobileLayout>
	);
}
