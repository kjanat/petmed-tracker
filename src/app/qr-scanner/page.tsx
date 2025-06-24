"use client";

import { AlertCircle, ArrowLeft, Camera, QrCode, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QrScanner from "qr-scanner";
import { useEffect, useRef, useState } from "react";
import MobileLayout from "@/components/MobileLayout";

export default function QRScannerPage() {
	const router = useRouter();
	const [isScanning, setIsScanning] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [hasPermission, setHasPermission] = useState<boolean | null>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const qrScannerRef = useRef<QrScanner | null>(null);

	// Handle QR code detection
	const handleQrResult = (result: QrScanner.ScanResult) => {
		const qrText = result.data;
		console.log("QR Code detected:", qrText);

		// Extract pet ID from QR code URL
		// Expected format: https://domain.com/qr?id=PETID or just the pet ID
		let petId = qrText;
		if (qrText.includes("/qr?id=")) {
			const url = new URL(qrText);
			petId = url.searchParams.get("id") || qrText;
		}

		// Stop scanning and navigate
		stopCamera();
		router.push(`/qr?id=${petId}`);
	};

	// Request camera permission and start video stream
	const startCamera = async () => {
		try {
			setError(null);

			if (!videoRef.current) {
				setError("Video element not found");
				return;
			}

			// Create QR scanner instance
			qrScannerRef.current = new QrScanner(videoRef.current, handleQrResult, {
				highlightScanRegion: true,
				highlightCodeOutline: true,
				preferredCamera: "environment", // Use back camera
			});

			await qrScannerRef.current.start();
			setHasPermission(true);
			setIsScanning(true);
		} catch (err) {
			console.error("Camera access error:", err);
			setHasPermission(false);
			setError(
				"Camera access denied. Please enable camera permissions to scan QR codes.",
			);
		}
	};

	// Stop camera stream
	const stopCamera = () => {
		if (qrScannerRef.current) {
			qrScannerRef.current.stop();
			qrScannerRef.current.destroy();
			qrScannerRef.current = null;
		}
		setIsScanning(false);
	};

	// Handle file upload for QR code
	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			const result = await QrScanner.scanImage(file);
			console.log("QR Code from file:", result);

			// Extract pet ID from QR code URL
			let petId = result;
			if (result.includes("/qr?id=")) {
				const url = new URL(result);
				petId = url.searchParams.get("id") || result;
			}

			router.push(`/qr?id=${petId}`);
		} catch (err) {
			console.error("Failed to scan QR code from file:", err);
			setError(
				"Could not detect QR code in the selected image. Please try another image.",
			);
		}
	};

	// Simulate QR code detection (for demo purposes)
	const simulateQRDetection = () => {
		// For demo purposes, let's simulate finding a QR code
		const mockPetId = "sample-pet-id";
		stopCamera();
		router.push(`/qr?id=${mockPetId}`);
	};

	// Manual pet ID entry
	const handleManualEntry = () => {
		const petId = prompt("Enter Pet QR Code ID:");
		if (petId && petId.trim()) {
			router.push(`/qr?id=${petId.trim()}`);
		}
	};

	useEffect(() => {
		// Cleanup camera on unmount
		return () => {
			stopCamera();
		};
	}, []);

	return (
		<MobileLayout activeTab="qr">
			<div className="px-4 py-6">
				{/* Header */}
				<div className="mb-6 flex items-center gap-3">
					<Link
						href="/"
						className="rounded-lg p-2 transition-colors hover:bg-gray-100"
					>
						<ArrowLeft size={20} className="text-gray-600" />
					</Link>
					<h1 className="font-bold text-2xl text-gray-900">Scan QR Code</h1>
				</div>

				{/* Instructions */}
				<div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
					<div className="flex items-start gap-3">
						<QrCode className="mt-0.5 text-blue-600" size={20} />
						<div>
							<h3 className="mb-1 font-semibold text-blue-900">How to scan</h3>
							<p className="text-blue-800 text-sm">
								Point your camera at a pet's QR code to view their medication
								schedule and log doses.
							</p>
						</div>
					</div>
				</div>

				{/* Camera Scanner */}
				<div className="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm">
					<div className="border-gray-100 border-b p-4">
						<h2 className="font-semibold text-gray-900">Camera Scanner</h2>
					</div>

					<div className="p-4">
						{!isScanning ? (
							<div className="py-8 text-center">
								<Camera className="mx-auto mb-4 text-gray-400" size={48} />
								{hasPermission === false ? (
									<div className="mb-4">
										<AlertCircle
											className="mx-auto mb-2 text-red-500"
											size={32}
										/>
										<p className="mb-4 text-red-600 text-sm">{error}</p>
									</div>
								) : (
									<p className="mb-4 text-gray-600">
										Tap the button below to start scanning QR codes
									</p>
								)}

								<button
									onClick={startCamera}
									className="mx-auto flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
								>
									<Camera size={16} />
									Start Camera
								</button>
							</div>
						) : (
							<div className="space-y-4">
								<div className="relative overflow-hidden rounded-lg bg-black">
									<video
										ref={videoRef}
										className="aspect-square w-full object-cover"
									/>
								</div>

								<div className="flex gap-3">
									<button
										onClick={stopCamera}
										className="flex-1 rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200"
									>
										Stop Camera
									</button>
									<button
										onClick={simulateQRDetection}
										className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700"
									>
										Simulate Scan
									</button>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Alternative Options */}
				<div className="rounded-lg border border-gray-200 bg-white shadow-sm">
					<div className="border-gray-100 border-b p-4">
						<h2 className="font-semibold text-gray-900">Other Options</h2>
					</div>

					<div className="space-y-3 p-4">
						{/* Upload Image */}
						<button
							onClick={() => fileInputRef.current?.click()}
							className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-gray-50"
						>
							<Upload size={16} className="text-gray-500" />
							<div>
								<div className="font-medium text-gray-700">
									Upload QR Code Image
								</div>
								<div className="text-gray-500 text-sm">
									Select an image from your device
								</div>
							</div>
						</button>

						{/* Manual Entry */}
						<button
							onClick={handleManualEntry}
							className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-gray-50"
						>
							<QrCode size={16} className="text-gray-500" />
							<div>
								<div className="font-medium text-gray-700">
									Enter Code Manually
								</div>
								<div className="text-gray-500 text-sm">
									Type the pet QR code ID
								</div>
							</div>
						</button>
					</div>
				</div>

				{/* Hidden file input */}
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					onChange={handleFileUpload}
					className="hidden"
				/>

				{/* Help Text */}
				<div className="mt-6 text-center">
					<p className="text-gray-500 text-xs">
						Can't find a QR code? Ask the pet owner to generate one from their
						pets page.
					</p>
				</div>
			</div>
		</MobileLayout>
	);
}
