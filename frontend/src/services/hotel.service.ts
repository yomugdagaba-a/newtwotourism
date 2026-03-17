// frontend/src/services/hotel.service.ts
import {
  HotelSummaryDto,
  HotelDetailInfoDto,
  HotelBookingResponseDto,
  HotelRatingRequestDto,
  HotelRatingResponseDto,
} from "../types/hotel";
import { BookingRequestDto } from "../types/hotel";
import { API_BASE_URL } from "./api";

/**
 * ============================
 * PUBLIC APIs
 * ============================
 */

// 🔹 Get hotels by tourism place
export async function getHotelsByTourism(
  tourismId: number,
  token?: string | null
): Promise<HotelSummaryDto[]> {
  const res = await fetch(`${API_BASE_URL}/tourisms/${tourismId}/hotels`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch hotels (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? data : data?.data ?? [];
}

// 🔹 Get all hotels (no tourism filter)
export async function getAllHotels(
  token?: string | null
): Promise<HotelSummaryDto[]> {
  const res = await fetch(`${API_BASE_URL}/hotels`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch hotels (${res.status})`);
  const data = await res.json();
  // Handle both array response and paginated response
  if (Array.isArray(data)) return data;
  if (data?.content && Array.isArray(data.content)) return data.content;
  return data?.data ?? [];
}

// 🔹 Get hotel detail
export async function getHotelDetails(
  hotelId: number,
  token?: string | null
): Promise<HotelDetailInfoDto | null> {
  const res = await fetch(`${API_BASE_URL}/hotels/${hotelId}/detail`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.id ? (data as HotelDetailInfoDto) : null;
}

// 🔹 Special fetch for booking page (includes all images eagerly)
export async function getHotelForBooking(
  hotelId: number,
  token?: string | null
): Promise<HotelDetailInfoDto | null> {
  const res = await fetch(`${API_BASE_URL}/hotels/${hotelId}/detail?eager=true`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.id ? (data as HotelDetailInfoDto) : null;
}

// Aliases
export const getHotelDetail = getHotelDetails;
export const fetchHotelDetail = getHotelDetails;

/**
 * ============================
 * USER ACTIONS
 * ============================
 */

// 🔹 Get all bookings for a user
// Backend: GET /api/bookings/my?userId={userId}
export async function getUserBookings(
  userId: number,
  token: string
): Promise<HotelBookingResponseDto[]> {
  const res = await fetch(`${API_BASE_URL}/bookings/my?userId=${userId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch user bookings");
  return res.json();
}

// 🔹 Book hotel (client)
// Backend: POST /api/bookings?userId={userId}
export async function bookHotel(
  request: BookingRequestDto,
  userId: number,
  token: string
): Promise<HotelBookingResponseDto> {
  const res = await fetch(`${API_BASE_URL}/bookings?userId=${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to book hotel");
  }
  return res.json();
}

// 🔹 Add hotel rating (one rating per user)
// Backend: POST /api/ratings/hotel
export async function addHotelRating(
  dto: HotelRatingRequestDto,
  token: string
): Promise<HotelRatingResponseDto> {
  const res = await fetch(`${API_BASE_URL}/ratings/hotel`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error("Failed to add hotel rating");
  return res.json();
}

// 🔹 Fetch hotel ratings
// Backend: GET /api/ratings/hotel/{hotelId}
export async function fetchHotelRatings(hotelId: number): Promise<HotelRatingResponseDto[]> {
  const res = await fetch(`${API_BASE_URL}/ratings/hotel/${hotelId}`);
  if (!res.ok) throw new Error("Failed to fetch hotel ratings");
  return res.json();
}

// 🔹 Check if user already rated hotel
export async function hasUserRatedHotel(hotelId: number, token: string): Promise<boolean> {
  try {
    await fetch(`${API_BASE_URL}/hotels/${hotelId}/ratings/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return true;
  } catch (err: any) {
    if (err?.status === 404) return false;
    throw err;
  }
}

/**
 * ============================
 * ADMIN APIs
 * ============================
 */

// ... keep your admin CRUD functions here exactly as before ...

/**
 * ============================
 * DEFAULT EXPORT
 * ============================
 */
export default {
  getHotelsByTourism,
  getAllHotels,
  getHotelDetails,
  getHotelDetail,
  fetchHotelDetail,
  getHotelForBooking,
  getUserBookings,
  bookHotel,
  addHotelRating,
  fetchHotelRatings,
  hasUserRatedHotel,
  // include your admin functions here
};
