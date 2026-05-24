// frontend/src/components/hotel/HotelCard.tsx
"use client";

import { HotelSummaryDto } from "@/types/hotel";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Button from "@/components/common/Button";
import { getImageUrl } from "@/utils/imageUrl";
import { useTranslation } from "react-i18next";
import { useTranslateText } from "@/hooks/useTranslateText";

interface Props {
  hotel: HotelSummaryDto;
}

const HotelCard: React.FC<Props> = ({ hotel }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const translatedName = useTranslateText(hotel.name);

  return (
    <div className="border rounded shadow hover:shadow-lg transition p-4 flex flex-col">
      {hotel.imageUrl && (
        <div className="w-full h-48 relative mb-3">
          <Image
            src={getImageUrl(hotel.imageUrl, "https://images.unsplash.com/photo-1564507592333-cdd18562ea6f?w=400")}
            alt={hotel.name}
            fill
            className="object-cover rounded"
          />
        </div>
      )}
      <h3 className="font-bold text-lg mb-1">{translatedName}</h3>
      <p className="text-yellow-500 mb-2">{hotel.stars}★</p>
      <Button onClick={() => router.push(`/hotels/${hotel.id}`)}>{t("hotel.viewDetails")}</Button>
    </div>
  );
};

export default HotelCard;
