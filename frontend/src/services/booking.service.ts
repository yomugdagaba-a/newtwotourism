// frontend/src/services/booking.service.ts - Hotel Booking Service

import { API_BASE_URL } from "./api";

const getAuthHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    
    // Try to parse JSON error for better message
    let errorMessage = `Request failed: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      // Extract user-friendly message from various error formats
      if (errorJson.rootCause) {
        errorMessage = getReadableErrorMessage(errorJson.rootCause);
      } else if (errorJson.error) {
        errorMessage = getReadableErrorMessage(errorJson.error);
      } else if (errorJson.message) {
        errorMessage = getReadableErrorMessage(errorJson.message);
      } else if (errorJson.details) {
        errorMessage = getReadableErrorMessage(errorJson.details);
      }
    } catch {
      // If not JSON, use the raw text
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return {} as T;
};

// Convert technical error messages to user-friendly messages
const getReadableErrorMessage = (error: string): string => {
  const errorLower = error.toLowerCase();
  
  if (errorLower.includes('not owner') || errorLower.includes('not the owner')) {
    return 'You do not have permission to manage this hotel\'s bookings. Only the hotel owner can perform this action.';
  }
  if (errorLower.includes('not found')) {
    return 'The requested resource was not found.';
  }
  if (errorLower.includes('unauthorized') || errorLower.includes('access denied')) {
    return 'You are not authorized to perform this action. Please log in again.';
  }
  if (errorLower.includes('invalid') && errorLower.includes('token')) {
    return 'Your session has expired. Please log in again.';
  }
  if (errorLower.includes('booking') && errorLower.includes('not found')) {
    return 'This booking could not be found. It may have been deleted.';
  }
  if (errorLower.includes('hotel') && errorLower.includes('not found')) {
    return 'This hotel could not be found.';
  }
  if (errorLower.includes('already')) {
    return error; // Keep "already" messages as they are usually clear
  }
  
  // Return original if no match, but clean it up
  return error.replace(/([a-z])([A-Z])/g, '$1 $2'); // Add spaces to camelCase
};

// Types
export interface BookingRequest {
  hotelId: number;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  numberOfRooms?: number;
  specialRequests?: string;
  clientPhone?: string;
  clientEmail?: string;
}

export interface HotelInfo {
  id: number;
  name: string;
  contactInfo: string;
  active: boolean;
  ownerId?: number;
  ownerName?: string;
}

export interface ClientInfo {
  id: number;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
}

export interface BookingMessage {
  id: number;
  senderId: number;
  senderName: string;
  message: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
}

export interface Booking {
  bookingId: number;
  hotel: HotelInfo;
  client: ClientInfo;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  numberOfRooms?: number;
  specialRequests?: string;
  bookingStatus: string;
  totalCost?: number;
  receiptImageUrl?: string;
  rejectionReason?: string;
  problemReport?: string;
  problemReported: boolean;
  createdAt: string;
  updatedAt: string;
  messages: BookingMessage[];
}

// Booking Status Flow
export const BOOKING_STATUS = {
  REQUESTED: 'REQUESTED',
  OWNER_ACCEPTED: 'OWNER_ACCEPTED',
  COST_PROPOSED: 'COST_PROPOSED',
  PAID: 'PAID',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

export class BookingService {
  // ==================== CLIENT OPERATIONS ====================

  static async createBooking(token: string, userId: number, data: BookingRequest): Promise<Booking> {
    const response = await fetch(
      `${API_BASE_URL}/bookings?userId=${userId}`,
      {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );
    return handleResponse<Booking>(response);
  }

  static async getMyBookings(token: string, userId: number): Promise<Booking[]> {
    const response = await fetch(
      `${API_BASE_URL}/bookings/my?userId=${userId}`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<Booking[]>(response);
  }

  static async getBookingById(token: string, bookingId: number, userId: number): Promise<Booking> {
    const response = await fetch(
      `${API_BASE_URL}/bookings/${bookingId}?userId=${userId}`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<Booking>(response);
  }

  static async uploadReceipt(token: string, bookingId: number, receiptUrl: string, userId: number): Promise<Booking> {
    const response = await fetch(
      `${API_BASE_URL}/bookings/${bookingId}/receipt?receiptUrl=${encodeURIComponent(receiptUrl)}&userId=${userId}`,
      { method: "POST", headers: getAuthHeaders(token) }
    );
    return handleResponse<Booking>(response);
  }

  static async uploadReceiptFile(token: string, bookingId: number, file: File, userId: number): Promise<Booking> {
    const formData = new FormData();
    formData.append("file", file);

    // Use AbortController for 60s timeout (Render free tier can be slow to wake)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(
        `${API_BASE_URL}/bookings/${bookingId}/receipt/upload?userId=${userId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
          signal: controller.signal,
        }
      );
      return handleResponse<Booking>(response);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('TIMEOUT_RELOAD');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  static async reportProblem(token: string, bookingId: number, problem: string, userId: number): Promise<Booking> {
    const response = await fetch(
      `${API_BASE_URL}/bookings/${bookingId}/problem?userId=${userId}`,
      {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ problem }),
      }
    );
    return handleResponse<Booking>(response);
  }

  static async sendMessage(token: string, bookingId: number, message: string, userId: number): Promise<Booking> {
    const response = await fetch(
      `${API_BASE_URL}/bookings/${bookingId}/message?userId=${userId}`,
      {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ message }),
      }
    );
    return handleResponse<Booking>(response);
  }

  static async hideBooking(token: string, bookingId: number, userId: number): Promise<Booking> {
    const response = await fetch(
      `${API_BASE_URL}/bookings/${bookingId}/hide?userId=${userId}`,
      {
        method: "POST",
        headers: getAuthHeaders(token),
      }
    );
    return handleResponse<Booking>(response);
  }

  // ==================== HOTEL OWNER OPERATIONS ====================

  static async getHotelBookings(token: string, hotelId: number, ownerId: number): Promise<Booking[]> {
    const response = await fetch(
      `${API_BASE_URL}/bookings/hotel/${hotelId}?ownerId=${ownerId}`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<Booking[]>(response);
  }

  static async getOwnerBookings(token: string, ownerId: number): Promise<Booking[]> {
    const response = await fetch(
      `${API_BASE_URL}/bookings/owner?ownerId=${ownerId}`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<Booking[]>(response);
  }

  static async acceptBookingRequest(token: string, bookingId: number, ownerId: number): Promise<Booking> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    try {
      const response = await fetch(
        `${API_BASE_URL}/bookings/${bookingId}/accept?ownerId=${ownerId}`,
        { method: "POST", headers: getAuthHeaders(token), signal: controller.signal }
      );
      return handleResponse<Booking>(response);
    } catch (err: any) {
      if (err.name === 'AbortError') throw new Error('TIMEOUT_RELOAD');
      throw err;
    } finally { clearTimeout(timeoutId); }
  }

  static async proposeCost(token: string, bookingId: number, cost: number, ownerId: number): Promise<Booking> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    try {
      const response = await fetch(
        `${API_BASE_URL}/bookings/${bookingId}/cost?cost=${cost}&ownerId=${ownerId}`,
        { method: "POST", headers: getAuthHeaders(token), signal: controller.signal }
      );
      return handleResponse<Booking>(response);
    } catch (err: any) {
      if (err.name === 'AbortError') throw new Error('TIMEOUT_RELOAD');
      throw err;
    } finally { clearTimeout(timeoutId); }
  }

  static async approveBooking(token: string, bookingId: number, ownerId: number): Promise<Booking> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    try {
      const response = await fetch(
        `${API_BASE_URL}/bookings/${bookingId}/approve?ownerId=${ownerId}`,
        { method: "POST", headers: getAuthHeaders(token), signal: controller.signal }
      );
      return handleResponse<Booking>(response);
    } catch (err: any) {
      if (err.name === 'AbortError') throw new Error('TIMEOUT_RELOAD');
      throw err;
    } finally { clearTimeout(timeoutId); }
  }

  static async rejectBooking(token: string, bookingId: number, reason: string, ownerId: number): Promise<Booking> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    try {
      const response = await fetch(
        `${API_BASE_URL}/bookings/${bookingId}/reject?reason=${encodeURIComponent(reason)}&ownerId=${ownerId}`,
        { method: "POST", headers: getAuthHeaders(token), signal: controller.signal }
      );
      return handleResponse<Booking>(response);
    } catch (err: any) {
      if (err.name === 'AbortError') throw new Error('TIMEOUT_RELOAD');
      throw err;
    } finally { clearTimeout(timeoutId); }
  }

  static async ownerSendMessage(token: string, bookingId: number, message: string, ownerId: number): Promise<Booking> {
    const response = await fetch(
      `${API_BASE_URL}/bookings/${bookingId}/owner-message?ownerId=${ownerId}`,
      {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ message }),
      }
    );
    return handleResponse<Booking>(response);
  }

  // ==================== ADMIN OPERATIONS ====================

  static async getAllBookings(token: string, page = 0, size = 20): Promise<Booking[]> {
    const response = await fetch(
      `${API_BASE_URL}/bookings/admin/all?page=${page}&size=${size}`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<Booking[]>(response);
  }

  static async getProblemBookings(token: string): Promise<Booking[]> {
    const response = await fetch(
      `${API_BASE_URL}/bookings/admin/problems`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<Booking[]>(response);
  }

  static async adminResolve(token: string, bookingId: number, resolution: string): Promise<Booking> {
    const response = await fetch(
      `${API_BASE_URL}/bookings/admin/${bookingId}/resolve`,
      {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ resolution }),
      }
    );
    return handleResponse<Booking>(response);
  }

  static async deleteBooking(token: string, bookingId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/admin/bookings/${bookingId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(token),
      }
    );
    return handleResponse<void>(response);
  }

  // ==================== HELPER METHODS ====================

  static getStatusColor(status: string): string {
    switch (status) {
      case 'REQUESTED': return 'text-yellow-700 font-bold';
      case 'OWNER_ACCEPTED': return 'text-blue-700 font-bold';
      case 'COST_PROPOSED': return 'text-purple-700 font-bold';
      case 'PAID': return 'text-indigo-700 font-bold';
      case 'APPROVED': return 'text-green-700 font-bold';
      case 'REJECTED': return 'text-red-700 font-bold';
      default: return 'text-gray-700 font-bold';
    }
  }

  static getStatusLabel(status: string): string {
    switch (status) {
      case 'REQUESTED': return 'Pending Review';
      case 'OWNER_ACCEPTED': return 'Accepted - Awaiting Cost';
      case 'COST_PROPOSED': return 'Cost Proposed - Pay Now';
      case 'PAID': return 'Paid - Awaiting Approval';
      case 'APPROVED': return 'Approved ✓';
      case 'REJECTED': return 'Rejected';
      default: return status;
    }
  }

  static getOwnerStatusLabel(status: string): string {
    switch (status) {
      case 'REQUESTED': return 'Requested';
      case 'OWNER_ACCEPTED': return 'Accepted';
      case 'COST_PROPOSED': return 'Cost Proposed';
      case 'PAID': return 'Paid - Approve?';
      case 'APPROVED': return 'Approved ✓';
      case 'REJECTED': return 'Rejected';
      default: return status;
    }
  }
}
