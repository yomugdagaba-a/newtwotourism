// frontend/src/components/hotel/HotelCard.tsx
"use client";

import { HotelSummaryDto } from "@/types/hotel";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Button from "@/components/common/Button";

interface Props {
  hotel: HotelSummaryDto;
}

const HotelCard: React.FC<Props> = ({ hotel }) => {
  const router = useRouter();

  return (
    <div className="border rounded shadow hover:shadow-lg transition p-4 flex flex-col">
      {hotel.imageUrl && (
        <div className="w-full h-48 relative mb-3">
          <Image src={hotel.imageUrl} alt={hotel.name} fill className="object-cover rounded" />
        </div>
      )}
      <h3 className="font-bold text-lg mb-1">{hotel.name}</h3>
      <p className="text-yellow-500 mb-2">{hotel.stars}★</p>
      <Button onClick={() => router.push(`/hotels/${hotel.id}`)}>View Details</Button>
    </div>
  );
};

export default HotelCard;
