// Request DTOs
export interface TourismRatingRequestDto {
  tourismPlaceId: number;
  rating: number; // 1-5
  comment?: string;
}

export interface HotelRatingRequestDto {
  hotelId: number;
  rating: number; // 1-5
  comment?: string;
}

// Response DTOs - matching backend
export interface TourismRatingResponseDto {
  id: number;
  rating: number;
  comment?: string;
  userFullName: string; // from backend TourismRatingResponseDto
  createdAt: string;
}

export interface HotelRatingResponseDto {
  id: number;
  rating: number;
  comment?: string;
  username: string;  // from backend HotelRatingResponseDto
  fullName: string;  // from backend HotelRatingResponseDto
}

// Summary DTO
export interface RatingSummaryResponseDto {
  avgRating: number;
  totalRatings: number;
}

// Generic Rating DTO for UI (unified format)
export interface RatingDto {
  id: number;
  rating: number;
  comment?: string;
  username?: string;
  fullName?: string;
  userFullName?: string;
  createdAt?: string;
}
