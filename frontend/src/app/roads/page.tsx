"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import { getRoadInfoByTourism } from "@/services/map.service";
import { RoadInfoDto } from "@/types/road";
import RoadInfo from "@/components/road/RoadInfo";
import { useAuthStore } from "@/store/useAuthStore";

function RoadsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ✅ Convert string | null to number | undefined safely
  const tourismIdRaw = searchParams.get("tourismId");
  const tourismId: number | undefined = tourismIdRaw ? Number(tourismIdRaw) : undefined;

  const [roads, setRoads] = useState<RoadInfoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = useAuthStore((state) => state.token ?? undefined);

  useEffect(() => {
    const load = async () => {
      if (!tourismId) {
        setError("Missing tourismId");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getRoadInfoByTourism(tourismId, token);
        setRoads(data ?? []);
      } catch (err: any) {
        console.error("Failed to load roads:", err);
        setError(err.message || "Failed to load road info");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tourismId, token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      <TopBar />
      <div className="px-4 md:px-6 py-8 md:py-12 max-w-6xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium mb-6 text-lg transition-all"
        >
          ← Back to Destination
        </button>

        <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-gray-900 to-emerald-700 bg-clip-text text-transparent mb-8">
          Roads & Travel Routes
        </h1>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-xl text-gray-600">Loading road information...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <p className="text-xl text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && roads.length === 0 && (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">No Routes Available</h2>
            <p className="text-xl text-gray-600 mb-8">No road information for this destination yet.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 md:mt-12">
          {roads.map((road) => (
            <div key={road.id} className="group bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-500 border border-white/50 h-full">
              <RoadInfo road={road} />

              {/* ✅ SIMPLIFIED HORSE BUTTON - REDIRECTS */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => router.push(`/horsers?roadId=${road.id}&tourismId=${tourismId}`)}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-300 transform bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 hover:from-purple-600 hover:to-pink-700"
                >
                  View Horse Services
                </button>
              </div>

              {/* Other Action Buttons */}
              <div className="mt-6 flex gap-3 pt-4">
                <button 
                  onClick={() => router.push(`/roads/${road.id}?tourismId=${tourismId}`)} 
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
                >
                  View Map Details
                </button>
                <button 
                  onClick={() => router.back()} 
                  className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-800 rounded-xl font-semibold hover:bg-gray-50 hover:shadow-lg transition-all"
                >
                  ← Back
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RoadsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>}>
      <RoadsContent />
    </Suspense>
  );
}
