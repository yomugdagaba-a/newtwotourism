"use client";

import { useEffect, useState } from "react";
import RoadInfo from "@/components/road/RoadInfo";
import { useRouter } from "next/navigation";
import { RoadInfoDto } from "@/types/road";
import { getRoadInfoByTourism } from "@/services/map.service";

interface Props {
  tourismId: number;
}

export default function RoadInfoTab({ tourismId }: Props) {
  const router = useRouter();
  const [roads, setRoads] = useState<RoadInfoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRoadInfo() {
      try {
        setLoading(true);
        const { token } = (await import("@/store/useAuthStore")).useAuthStore.getState();
        const data = await getRoadInfoByTourism(tourismId, token ?? undefined);
        setRoads(data);
      } catch (err: any) {
        setError(err.message || "Failed to load road information");
      } finally {
        setLoading(false);
      }
    }

    loadRoadInfo();
  }, [tourismId]);

  if (loading) {
    return <p className="text-gray-500">Loading road information...</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  if (!roads.length) {
    return <p className="text-gray-500">No road information available.</p>;
  }

  return (
    <div className="space-y-6">
      {roads.map((road) => (
        <div
          key={road.id}
          className="border rounded-lg p-4 shadow-sm bg-white"
        >
          {/* Road Info */}
          <RoadInfo road={road} />

          <div className="mt-3 flex gap-3">
            <button 
              className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition" 
              onClick={() => router.push(`/roads/${road.id}`)}
            >
              View details
            </button>
            
            {/* Horse Services Button - Navigate to dedicated page */}
            <button 
              className="px-3 py-2 rounded-md bg-amber-600 text-white hover:bg-amber-700 transition flex items-center gap-2" 
              onClick={() => router.push(`/horsers?roadId=${road.id}`)}
            >
              🐴 Horse Services
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
