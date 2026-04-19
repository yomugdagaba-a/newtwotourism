// frontend/src/types/hotel.ts

export interface HotelSummaryDto {
  id: number;
  name: string;
  category?: string;
  imageUrl?: string | null;  // allow null (for backward compatibility)
  images?: Array<{ id: number; imageUrl: string; displayOrder: number }>;  // new format
  viewersCount: number;
  location?: string;
  stars?: number;            // optional
}

export interface HotelDetailInfoDto {
  id: number;
  name: string;
  description: string;
  category?: string;
  address?: string;
  city?: string;
  images: string[];
  viewersCount: number;
  starRating?: number;
  stars?: number;
  averageRating?: number;
  contactInfo?: string;
  policies?: string;
  active?: boolean;
  ownerId?: number;
  ownerName?: string;
  tourismPlaceId?: number;
  tourismPlaceName?: string;
  ratingSummary?: RatingSummaryResponseDto;
  ratings?: HotelRatingResponseDto[];
}

export interface HotelBookingResponseDto {
  id: number;
  hotelId: number;
  userId: number;
  status: string;
  totalCost?: number;
  receiptUrl?: string;
  createdAt: string;
}

// =======================
// Hotel Rating Types
// =======================

export interface HotelRatingRequestDto {
  hotelId: number;
  rating: number; // 1-5
  comment?: string;
}

export interface HotelRatingResponseDto {
  id: number;
  rating: number;
  comment?: string;
  username: string;
  fullName: string;
}

// Optional: summary for avg rating
export interface RatingSummaryResponseDto {
  avgRating: number;
  totalRatings: number;
}

// =======================
// Booking Request (for booking APIs)
export interface BookingRequestDto {
  hotelId: number;
  userId: number;
  checkIn: string;
  checkOut: string;
  guests: number;
}
