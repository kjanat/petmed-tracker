"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import MobileLayout from "@/components/MobileLayout";
import {
  ArrowLeft,
  Coffee,
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface NewFoodSchedulePageProps {
  params: Promise<{ id: string }>;
}

const FOOD_TYPE_SUGGESTIONS = [
  "Dry Kibble",
  "Wet Food",
  "Raw Food",
  "Treats",
  "Supplements",
  "Prescription Diet",
  "Puppy Food",
  "Senior Food",
  "Weight Management",
  "Dental Chews",
];

const UNIT_OPTIONS = [
  "cups",
  "grams",
  "oz",
  "lbs",
  "pieces",
  "scoops",
  "tbsp",
  "tsp",
  "ml",
];

export default function NewFoodSchedulePage({ params }: NewFoodSchedulePageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [formData, setFormData] = useState({
    foodType: "",
    amount: "",
    unit: "",
    times: [""],
    instructions: "",
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();

  // Resolve params
  useState(() => {
    params.then(setResolvedParams);
  });

  const { data: pet } = api.pet.getById.useQuery(
    { id: resolvedParams?.id ?? "" },
    { enabled: !!resolvedParams?.id }
  );

  const createFoodScheduleMutation = api.food.create.useMutation({
    onSuccess: () => {
      toast.success("Food schedule created successfully!");
      router.push(`/pets/${resolvedParams?.id}/food`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      times: [...prev.times, ""]
    }));
  };

  const removeTimeSlot = (index: number) => {
    if (formData.times.length > 1) {
      setFormData(prev => ({
        ...prev,
        times: prev.times.filter((_, i) => i !== index)
      }));
    }
  };

  const updateTimeSlot = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      times: prev.times.map((time, i) => i === index ? value : time)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resolvedParams?.id) return;
    
    // Validation
    if (!formData.foodType.trim()) {
      toast.error("Please enter a food type");
      return;
    }
    
    const validTimes = formData.times.filter(time => time.trim() !== "");
    if (validTimes.length === 0) {
      toast.error("Please add at least one feeding time");
      return;
    }
    
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const invalidTimes = validTimes.filter(time => !timeRegex.test(time));
    if (invalidTimes.length > 0) {
      toast.error("Please use valid time format (HH:MM)");
      return;
    }
    
    createFoodScheduleMutation.mutate({
      petId: resolvedParams.id,
      foodType: formData.foodType.trim(),
      amount: formData.amount.trim() || undefined,
      unit: formData.unit.trim() || undefined,
      times: validTimes,
      instructions: formData.instructions.trim() || undefined,
    });
  };

  const filteredSuggestions = FOOD_TYPE_SUGGESTIONS.filter(suggestion =>
    suggestion.toLowerCase().includes(formData.foodType.toLowerCase())
  );

  if (!resolvedParams?.id) {
    return (
      <MobileLayout>
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="p-4 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Add Food Schedule</h1>
            <p className="text-sm text-gray-600">{pet?.name || "Pet"}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Food Type */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Food Type *
            </label>
            <div className="relative">
              <Coffee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={formData.foodType}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, foodType: e.target.value }));
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Enter food type (e.g., Dry Kibble, Wet Food)"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            {/* Suggestions */}
            {showSuggestions && formData.foodType && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto z-10">
                {filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, foodType: suggestion }));
                      setShowSuggestions(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Amount & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <input
                type="text"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="1.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select unit</option>
                {UNIT_OPTIONS.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Feeding Times */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Feeding Times *
              </label>
              <button
                type="button"
                onClick={addTimeSlot}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus size={16} />
                Add Time
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.times.map((time, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => updateTimeSlot(index, e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  {formData.times.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTimeSlot(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions / Notes
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Special feeding instructions, location, etc."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createFoodScheduleMutation.isPending}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {createFoodScheduleMutation.isPending ? (
                "Creating..."
              ) : (
                <>
                  <CheckCircle size={16} />
                  Create Schedule
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {createFoodScheduleMutation.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Failed to create food schedule
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    {createFoodScheduleMutation.error.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </MobileLayout>
  );
}
