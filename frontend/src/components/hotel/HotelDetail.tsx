// frontend/src/components/hotel/HotelDetail.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { HotelDetailInfoDto } from "@/types/hotel";
import { getHotelDetails } from "@/services/hotel.service";
import HotelRatings from "./HotelRatings";
import HotelBookingForm from "./HotelBookingForm";
import Image from "next/image";
import { getImageUrl } from "@/utils/imageUrl";
import { useTranslation } from "react-i18next";
import { useTranslateText } from "@/hooks/useTranslateText";

interface Props {
  hotel?: HotelDetailInfoDto;
  hotelId?: number;
  onBack?: () => void;
}

const HotelDetail: React.FC<Props> = ({ hotel: propHotel, hotelId: propHotelId, onBack }) => {
  const params = useParams();
  const routeHotelId = Number(params.id);
  const hotelId = propHotelId || routeHotelId;

  const [hotel, setHotel] = useState<HotelDetailInfoDto | null>(propHotel ?? null);
  const [loading, setLoading] = useState(!propHotel);
  const { t } = useTranslation();

  // Translate dynamic content
  const translatedName = useTranslateText(hotel?.name);
  const translatedDescription = useTranslateText(hotel?.description);
  const translatedPolicies = useTranslateText(hotel?.policies);

  useEffect(() => {
    if (propHotel) { setLoading(false); return; }
    if (!hotelId) return;
    getHotelDetails(hotelId)
      .then((res) => setHotel(res))
      .catch((err) => console.error("Failed to load hotel:", err))
      .finally(() => setLoading(false));
  }, [hotelId, propHotel]);

  if (loading) return <div className="p-8 text-center">{t("hotel.loading")}</div>;
  if (!hotel) return <div className="p-8 text-center text-red-500">{t("hotel.notFound")}</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-6">
          {t("hotel.backToList")}
        </button>
      )}

      {/* Images */}
      {hotel.images && hotel.images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hotel.images.map((img, idx) => {
            const imageUrl = typeof img === "string" ? img : (img as any)?.imageUrl || "";
            return imageUrl ? (
              <div key={idx} className="relative w-full h-64 rounded-lg overflow-hidden">
                <Image
                  src={getImageUrl(imageUrl, "https://images.unsplash.com/photo-1564507592333-cdd18562ea6f?w=400")}
                  alt={`${hotel.name} image ${idx + 1}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : null;
          })}
        </div>
      )}

      {/* Info */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-gray-900">{translatedName}</h1>
        <div className="flex items-center gap-2">
          <span className="text-yellow-500 text-2xl">★ {hotel.stars}</span>
          {hotel.averageRating && (
            <span className="text-sm text-gray-600">({hotel.averageRating.toFixed(1)} {t("hotel.rating")})</span>
          )}
        </div>
        <p className="text-gray-700 leading-relaxed">{translatedDescription}</p>

        {hotel.contactInfo && (
          <p className="font-semibold text-gray-900">
            📞 {t("hotel.contact")}: <a href={`tel:${hotel.contactInfo}`} className="text-blue-600 hover:underline">{hotel.contactInfo}</a>
          </p>
        )}

        {hotel.policies && (
          <p className="font-semibold text-gray-900">
            📋 {t("hotel.policies")}: {translatedPolicies}
          </p>
        )}
      </div>

      <HotelBookingForm hotelId={hotel.id} hotelName={hotel.name} />
      <HotelRatings ratings={hotel.ratings || []} averageRating={hotel.averageRating || 0} />
    </div>
  );
};

export default HotelDetail;
