"use client";

import { useState, useEffect } from "react";
import { getHotelsByTourism } from "@/services/hotel.service";
import { useAuthStore } from "@/store/useAuthStore";
import { HotelSummaryDto } from "@/types/hotel";
import HotelDetails from "@/components/hotel/HotelDetail";

interface Props {
  tourismId: number;
  
}

export default function HotelsTab({ tourismId }: Props) {
  const [hotels, setHotels] = useState<HotelSummaryDto[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<number | null>(null);

  useEffect(() => {
    const { token } = useAuthStore.getState();
    getHotelsByTourism(tourismId, token).then(setHotels);
  }, [tourismId]);

  if (selectedHotel)
    return (
      <HotelDetails hotelId={selectedHotel} onBack={() => setSelectedHotel(null)} />
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {hotels.map(hotel => (
        <div
          key={hotel.id}
          className="border rounded-md overflow-hidden cursor-pointer hover:shadow-lg transition"
          onClick={() => setSelectedHotel(hotel.id)}
        >
          <img src={hotel.imageUrl || "/images/placeholder.jpg"} alt={hotel.name} className="w-full h-40 object-cover" />
          <div className="p-2">
            <h3 className="font-semibold">{hotel.name}</h3>
            <p>{hotel.stars} stars</p>
          </div>
        </div>
      ))}
    </div>
  );
}
