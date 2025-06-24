"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/trpc/react";
import MobileLayout from "@/components/MobileLayout";
import { Plus, Heart, Calendar, QrCode } from "lucide-react";
import QRCode from "react-qr-code";

export default function PetsPage() {
  const [showQrFor, setShowQrFor] = useState<string | null>(null);
  const { data: pets, isLoading } = api.pet.getMyPets.useQuery();

  if (isLoading) {
    return (
      <MobileLayout activeTab="pets">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </MobileLayout>
    );
  }

  if (!pets || pets.length === 0) {
    return (
      <MobileLayout activeTab="pets">
        <div className="px-4 py-8">
          <div className="text-center">
            <Heart className="mx-auto mb-4 text-gray-400" size={48} />
            <h2 className="text-xl font-semibold text-gray-900 mb-4">No pets yet</h2>
            <p className="text-gray-600 mb-6">
              Add your first pet to start tracking their medication schedule.
            </p>
            <Link
              href="/pets/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Add Your First Pet
            </Link>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout activeTab="pets">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Pets</h1>
          <Link
            href="/pets/new"
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
          </Link>
        </div>

        {/* Pets Grid */}
        <div className="space-y-4">
          {pets.map((pet) => (
            <div key={pet.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{pet.name}</h3>
                  {pet.species && (
                    <p className="text-gray-600 text-sm">
                      {pet.species}{pet.breed && ` • ${pet.breed}`}
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() => setShowQrFor(showQrFor === pet.id ? null : pet.id)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <QrCode size={20} />
                </button>
              </div>

              {/* QR Code Display */}
              {showQrFor === pet.id && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg text-center">
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <QRCode
                      value={`${window.location.origin}/qr?id=${pet.qrCodeId}`}
                      size={200}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Scan this QR code to view {pet.name}'s medication schedule
                  </p>
                  <button
                    className="mt-2 text-blue-600 text-sm font-medium hover:text-blue-700"
                    onClick={() => {
                      // Download QR code as PNG
                      const svg = document.querySelector('svg');
                      if (svg) {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const data = new XMLSerializer().serializeToString(svg);
                        const DOMURL = window.URL || window.webkitURL || window;
                        const img = new Image();
                        const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
                        const url = DOMURL.createObjectURL(svgBlob);
                        
                        img.onload = () => {
                          canvas.width = img.width;
                          canvas.height = img.height;
                          ctx?.drawImage(img, 0, 0);
                          DOMURL.revokeObjectURL(url);
                          
                          canvas.toBlob((blob) => {
                            if (blob) {
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${pet.name}-medication-qr.png`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }
                          });
                        };
                        
                        img.src = url;
                      }
                    }}
                  >
                    Download QR Code
                  </button>
                </div>
              )}

              {/* Medication Summary */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Active Medications: {pet.medications?.filter(m => m.isActive).length || 0}
                  </span>
                </div>
                
                {pet.medications && pet.medications.length > 0 && (
                  <div className="space-y-1">
                    {pet.medications.slice(0, 3).map((med) => (
                      <div key={med.id} className="text-sm text-gray-600">
                        • {med.name}
                        {med.dosage && ` (${med.dosage}${med.unit ? ` ${med.unit}` : ''})`}
                      </div>
                    ))}
                    {pet.medications.length > 3 && (
                      <div className="text-sm text-gray-500">
                        +{pet.medications.length - 3} more...
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Link
                  href={`/pets/${pet.id}`}
                  className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  View Details
                </Link>
                <Link
                  href={`/pets/${pet.id}/medications`}
                  className="flex-1 bg-gray-100 text-gray-700 text-center py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Medications
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
