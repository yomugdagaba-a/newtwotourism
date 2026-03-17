// frontend/src/components/hotel/HotelDetail.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { HotelDetailInfoDto } from "@/types/hotel";
import { getHotelDetails } from "@/services/hotel.service";
import HotelRatings from "./HotelRatings";
import HotelBookingForm from "./HotelBookingForm";
import Image from "next/image";

interface Props {
  hotel?: HotelDetailInfoDto; // If parent already fetched hotel, pass it here
  hotelId?: number;           // From HotelsTab or route fallback
  onBack?: () => void;        // Back button from list
}

const HotelDetail: React.FC<Props> = ({ hotel: propHotel, hotelId: propHotelId, onBack }) => {
  const params = useParams();
  const routeHotelId = Number(params.id);
  const hotelId = propHotelId || routeHotelId; // Prefer prop, fallback to route

  const [hotel, setHotel] = useState<HotelDetailInfoDto | null>(propHotel ?? null);
  const [loading, setLoading] = useState(!propHotel);

  useEffect(() => {
    if (propHotel) {
      // Parent provided hotel — no need to fetch
      setLoading(false);
      return;
    }

    if (!hotelId) return;

    getHotelDetails(hotelId)
      .then(res => setHotel(res))
      .catch(err => console.error("Failed to load hotel:", err))
      .finally(() => setLoading(false));
  }, [hotelId, propHotel]);

  if (loading) return <div className="p-8 text-center">Loading hotel...</div>;
  if (!hotel) return <div className="p-8 text-center text-red-500">Hotel not found.</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button if from list view */}
      {onBack && (
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-6"
        >
          ← Back to list
        </button>
      )}

      {/* Hotel images */}
      {hotel.images && hotel.images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hotel.images.map((img, idx) => {
            // Extract imageUrl from image object (handle both string and object formats)
            const imageUrl = typeof img === 'string' ? img : (img as any)?.imageUrl || '';
            
            return imageUrl ? (
              <div key={idx} className="relative w-full h-64 rounded-lg overflow-hidden">
                <Image 
                  src={imageUrl} 
                  alt={`${hotel.name} image ${idx + 1}`} 
                  fill 
                  className="object-cover hover:scale-105 transition-transform duration-300" 
                />
              </div>
            ) : null;
          })}
        </div>
      )}

      {/* Hotel info */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-gray-900">{hotel.name}</h1>
        <div className="flex items-center gap-2">
          <span className="text-yellow-500 text-2xl">★ {hotel.stars}</span>
          {hotel.averageRating && (
            <span className="text-sm text-gray-600">
              ({hotel.averageRating.toFixed(1)} rating)
            </span>
          )}
        </div>
        <p className="text-gray-700 leading-relaxed">{hotel.description}</p>
        
        {hotel.contactInfo && (
          <p className="font-semibold text-gray-900">
            📞 Contact: <a href={`tel:${hotel.contactInfo}`} className="text-blue-600 hover:underline">{hotel.contactInfo}</a>
          </p>
        )}
        
        {hotel.policies && (
          <p className="font-semibold text-gray-900">
            📋 Policies: {hotel.policies}
          </p>
        )}
      </div>

      {/* Booking form */}
      <HotelBookingForm 
        hotelId={hotel.id} 
        hotelName={hotel.name} 
      />

      {/* Ratings */}
      <HotelRatings 
        ratings={hotel.ratings || []} 
        averageRating={hotel.averageRating || 0} 
      />
    </div>
  );
};

export default HotelDetail;
