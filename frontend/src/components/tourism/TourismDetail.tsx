// frontend/src/components/tourism/TourismDetail.tsx
"use client";

import React from "react";
import { TourismFullDetailDto } from "../../types/tourism";
import TourismTabs from "./TourismTabs";
import TourismImages from "./TourismImages";
import TourismRatings from "./TourismRatings";

interface Props {
  tourismId: number; // ✅ Changed to match parent prop
}

const TourismDetail: React.FC<Props> = ({ tourismId }) => {
  // TODO: Fetch tourism data using tourismId
  const [tourism, setTourism] = React.useState<TourismFullDetailDto | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchTourism = async () => {
      try {
        setLoading(true);
        // Use your tourism service here
        // const data = await fetchTourismDetail(tourismId);
        // setTourism(data);
      } catch (error) {
        console.error("Failed to fetch tourism:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTourism();
  }, [tourismId]);

  if (loading) return <div>Loading...</div>;
  if (!tourism) return <div>Tourism not found</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{tourism.name}</h1>
      <p className="text-gray-700">{tourism.description}</p>
      <div className="flex space-x-4 text-sm text-gray-600">
        <span>Wereda: {tourism.wereda}</span>
        <span>Kebele: {tourism.kebele}</span>
        <span>Best Time: {tourism.bestTime || "-"}</span>
      </div>

      <TourismImages images={tourism.images} />
      // frontend/src/components/tourism/TourismDetail.tsx
<TourismTabs tourismId={tourismId} />  // ✅ Change this line
<TourismRatings
  ratings={tourism.ratings}
  summary={tourism.ratingSummary}


      />
    </div>
  );
};

export default TourismDetail;
