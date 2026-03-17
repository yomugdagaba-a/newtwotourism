// frontend/src/services/rating.service.ts - Unified Rating Service

import { API_BASE_URL } from "./api";

// ========================
// Types
// ========================
export interface TourismRatingRequest {
  tourismPlaceId: number;
  rating: number;
  comment?: string;
}

export interface HotelRatingRequest {
  hotelId: number;
  rating: number;
  comment?: string;
}

export interface TourismRatingResponse {
  id: number;
  rating: number;
  comment?: string;
  userFullName: string;
  createdAt: string;
}

export interface HotelRatingResponse {
  id: number;
  rating: number;
  comment?: string;
  username: string;
  fullName: string;
}

// ========================
// Helper Functions
// ========================
const getAuthHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

// ========================
// Tourism Rating API
// ========================
export const submitTourismRating = async (
  tourismPlaceId: number,
  rating: number,
  comment: string | undefined,
  token: string
): Promise<void> => {
  const payload: TourismRatingRequest = {
    tourismPlaceId,
    rating,
    comment,
  };

  const response = await fetch(`${API_BASE_URL}/ratings/tourism`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to submit rating: ${response.status}`);
  }
};

export const fetchTourismRatings = async (
  tourismPlaceId: number,
  token?: string
): Promise<TourismRatingResponse[]> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/ratings/tourism/${tourismPlaceId}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ratings: ${response.status}`);
  }

  return response.json();
};

// ========================
// Hotel Rating API
// ========================
export const submitHotelRating = async (
  hotelId: number,
  rating: number,
  comment: string | undefined,
  token: string
): Promise<void> => {
  const payload: HotelRatingRequest = {
    hotelId,
    rating,
    comment,
  };

  const response = await fetch(`${API_BASE_URL}/ratings/hotel`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to submit rating: ${response.status}`);
  }
};

export const fetchHotelRatings = async (
  hotelId: number,
  token?: string
): Promise<HotelRatingResponse[]> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/ratings/hotel/${hotelId}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ratings: ${response.status}`);
  }

  return response.json();
};

// ========================
// Default Export
// ========================
export default {
  submitTourismRating,
  fetchTourismRatings,
  submitHotelRating,
  fetchHotelRatings,
};
