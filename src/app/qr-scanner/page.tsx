"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import MobileLayout from "@/components/MobileLayout";
import { QrCode, Camera, Upload, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import QrScanner from "qr-scanner";

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
    if (qrText.includes('/qr?id=')) {
      const url = new URL(qrText);
      petId = url.searchParams.get('id') || qrText;
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
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        handleQrResult,
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Use back camera
        }
      );

      await qrScannerRef.current.start();
      setHasPermission(true);
      setIsScanning(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setHasPermission(false);
      setError("Camera access denied. Please enable camera permissions to scan QR codes.");
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
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await QrScanner.scanImage(file);
      console.log("QR Code from file:", result);
      
      // Extract pet ID from QR code URL
      let petId = result;
      if (result.includes('/qr?id=')) {
        const url = new URL(result);
        petId = url.searchParams.get('id') || result;
      }
      
      router.push(`/qr?id=${petId}`);
    } catch (err) {
      console.error("Failed to scan QR code from file:", err);
      setError("Could not detect QR code in the selected image. Please try another image.");
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
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Scan QR Code</h1>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <QrCode className="text-blue-600 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">How to scan</h3>
              <p className="text-sm text-blue-800">
                Point your camera at a pet's QR code to view their medication schedule and log doses.
              </p>
            </div>
          </div>
        </div>

        {/* Camera Scanner */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Camera Scanner</h2>
          </div>
          
          <div className="p-4">
            {!isScanning ? (
              <div className="text-center py-8">
                <Camera className="mx-auto mb-4 text-gray-400" size={48} />
                {hasPermission === false ? (
                  <div className="mb-4">
                    <AlertCircle className="mx-auto mb-2 text-red-500" size={32} />
                    <p className="text-red-600 text-sm mb-4">{error}</p>
                  </div>
                ) : (
                  <p className="text-gray-600 mb-4">
                    Tap the button below to start scanning QR codes
                  </p>
                )}
                
                <button
                  onClick={startCamera}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <Camera size={16} />
                  Start Camera
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full aspect-square object-cover"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={stopCamera}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Stop Camera
                  </button>
                  <button
                    onClick={simulateQRDetection}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Simulate Scan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Alternative Options */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Other Options</h2>
          </div>
          
          <div className="p-4 space-y-3">
            {/* Upload Image */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
            >
              <Upload size={16} className="text-gray-500" />
              <div>
                <div className="text-gray-700 font-medium">Upload QR Code Image</div>
                <div className="text-sm text-gray-500">Select an image from your device</div>
              </div>
            </button>
            
            {/* Manual Entry */}
            <button
              onClick={handleManualEntry}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
            >
              <QrCode size={16} className="text-gray-500" />
              <div>
                <div className="text-gray-700 font-medium">Enter Code Manually</div>
                <div className="text-sm text-gray-500">Type the pet QR code ID</div>
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
          <p className="text-xs text-gray-500">
            Can't find a QR code? Ask the pet owner to generate one from their pets page.
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}
