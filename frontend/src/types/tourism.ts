// frontend/src/types/tourism.ts

import { TourismImageDto } from "./tourismImage";

export interface TourismPublicCard {
  id: number;
  name: string;
  imageUrl?: string;
  viewersCount: number;
  category?: string;
  categories?: string[];
  wereda?: string;
  kebele?: string;
  description?: string;
}

export interface NearbyTourismDto {
  id: number;
  name: string;
  imageUrl?: string;
  categories?: string[];
  wereda?: string;
}

export interface RatingSummaryResponseDto {
  avgRating: number;   // matches backend
  totalRatings: number;
}

export interface TourismRatingRequestDto {
  rating: number; // 1-5
  comment?: string;
}

export interface TourismRatingResponseDto {
  id: number;
  rating: number;
  comment?: string;
  userFullName: string;  // backend field
  createdAt: string;
}

export interface TourismFullDetailDto {
  id: number;
  name: string;
  description: string;
  wereda: string;
  kebele: string;
  bestTime?: string;
  peaceInfo?: string;
  visitTime?: string; // duration in ISO 8601 format
  languages: string[];
  viewersCount: number;
  categories?: string[];
  createdAt?: string;
  latitude?: number;
  longitude?: number;
  images: TourismImageDto[];  // Changed from string[] to include title/description
  nearbyPlaces: NearbyTourismDto[];
  ratingSummary: RatingSummaryResponseDto;
  ratings: TourismRatingResponseDto[];
}

export interface TourismPublicCardDto {
  id: number;
  name: string;
  imageUrl?: string;
  viewersCount: number;
  categories?: string[];
  wereda?: string;
  kebele?: string;
  description?: string;
}

export interface Page<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
