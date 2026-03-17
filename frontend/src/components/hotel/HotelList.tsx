// frontend/src/components/hotel/HotelList.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { HotelSummaryDto } from "@/types/hotel";
import HotelCard from "./HotelCard";
import { getHotelsByTourism } from "@/services/hotel.service";

interface Props {
  tourismPlaceId: number;
}

const HotelList: React.FC<Props> = ({ tourismPlaceId }) => {
  const [hotels, setHotels] = useState<HotelSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { token } = useAuthStore.getState();
    getHotelsByTourism(tourismPlaceId, token)
      .then(res => setHotels(res))
      .finally(() => setLoading(false));
  }, [tourismPlaceId]);

  if (loading) return <div>Loading hotels...</div>;
  if (!hotels.length) return <div>No hotels found.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {hotels.map(hotel => (
        <HotelCard key={hotel.id} hotel={hotel} />
      ))}
    </div>
  );
};

export default HotelList;
