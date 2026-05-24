"use client";

import { useState, useEffect } from "react";
import { getHotelsByTourism } from "@/services/hotel.service";
import { useAuthStore } from "@/store/useAuthStore";
import { HotelSummaryDto } from "@/types/hotel";
import HotelDetails from "@/components/hotel/HotelDetail";
import { getImageUrl } from "@/utils/imageUrl";
import { useTranslation } from "react-i18next";
import { useTranslateText } from "@/hooks/useTranslateText";

interface Props {
  tourismId: number;
}

function HotelCard({ hotel, onClick }: { hotel: HotelSummaryDto; onClick: () => void }) {
  const { t } = useTranslation();
  const translatedName = useTranslateText(hotel.name);
  return (
    <div
      className="border rounded-md overflow-hidden cursor-pointer hover:shadow-lg transition"
      onClick={onClick}
    >
      <img src={getImageUrl(hotel.imageUrl, "/images/placeholder.jpg")} alt={hotel.name} className="w-full h-40 object-cover" />
      <div className="p-2">
        <h3 className="font-semibold">{translatedName}</h3>
        <p>{hotel.stars} {t("hotel.stars")}</p>
      </div>
    </div>
  );
}

export default function HotelsTab({ tourismId }: Props) {
  const [hotels, setHotels] = useState<HotelSummaryDto[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<number | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const { token } = useAuthStore.getState();
    getHotelsByTourism(tourismId, token).then(setHotels);
  }, [tourismId]);

  if (selectedHotel)
    return <HotelDetails hotelId={selectedHotel} onBack={() => setSelectedHotel(null)} />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {hotels.map(hotel => (
        <HotelCard key={hotel.id} hotel={hotel} onClick={() => setSelectedHotel(hotel.id)} />
      ))}
    </div>
  );
}
