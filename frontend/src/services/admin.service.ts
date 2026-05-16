// frontend/src/services/admin.service.ts - Comprehensive Admin Service

import { API_BASE_URL } from "./api";

// ========================
// Helper Functions
// ========================
const getAuthHeaders = (token: string) => {
  console.log('🔑 Using token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ API Error ${response.status}:`, errorText);
    
    // Handle 401 - token expired or invalid
    if (response.status === 401) {
      console.error('🔒 Authentication failed - token may be expired');
      // Clear tokens and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = '/auth/login?error=session_expired';
      }
    }
    
    throw new Error(errorText || `Request failed: ${response.status}`);
  }
  
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return {} as T;
};

// ========================
// User Types
// ========================
export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  roles: (string | { id: number; name: string })[];
  active: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface UserListResponse {
  content: User[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ========================
// Hotel Types
// ========================
export interface HotelCreateDto {
  name: string;
  description?: string;
  tourismPlaceId: number;
  starRating: number;
  contactInfo: string;
  policies?: string;
  images?: string[];
  mainImageUrl?: string;
  active?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface HotelUpdateDto {
  name?: string;
  description?: string;
  starRating?: number;
  contactInfo?: string;
  policies?: string;
  images?: string[];
  mainImageUrl?: string;
  active?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface Hotel {
  id: number;
  name: string;
  description?: string;
  starRating?: number;
  stars?: number;  // Backend returns 'stars' instead of 'starRating'
  contactInfo?: string;
  policies?: string;
  images: (string | { id?: number; imageUrl: string; displayOrder?: number })[];
  viewersCount?: number;
  tourismId?: number;
  tourismPlaceId?: number;  // Backend returns this property
  tourismPlaceName?: string;
  ownerId?: number;
  ownerName?: string;
  active?: boolean;
  createdAt?: string;
}

// ========================
// Tourism Types
// ========================
export interface TourismCreateDto {
  name: string;
  description: string;
  wereda: string;
  kebele: string;
  categories: string[];
  bestTime?: string;
  peaceInfo?: string;
  visitTime?: string;
  languages?: string[];
  images?: string[];
  imageUrl?: string;  // Main image URL
  status?: string;    // ACTIVE or BLOCKED
}

export interface TourismUpdateDto {
  name?: string;
  description?: string;
  wereda?: string;
  kebele?: string;
  categories?: string[];
  bestTime?: string;
  peaceInfo?: string;
  visitTime?: string;
  languages?: string[];
  images?: string[];
  imageUrl?: string;  // Main image URL
  status?: string;    // ACTIVE or BLOCKED
}

export interface Tourism {
  id: number;
  name: string;
  description: string;
  wereda: string;
  kebele: string;
  categories?: string[];
  bestTime?: string;
  peaceInfo?: string;
  visitTime?: string;
  languages: string[];
  images: string[];
  imageUrl?: string;  // Main image URL
  status?: string;    // ACTIVE or BLOCKED
  viewersCount: number;
  createdAt: string;
}

// ========================
// Tourism Image Types
// ========================
export interface TourismImage {
  id: number;
  imageUrl: string;
  title: string | null;
  description: string | null;
  isMain: boolean;
  displayOrder: number;
}

export interface TourismImageCreateDto {
  imageUrl: string;
  title?: string;
  description?: string;
  isMain?: boolean;
  displayOrder?: number;
}

// ========================
// Hotel Image Types
// ========================
export interface HotelImage {
  id: number;
  imageUrl: string;
  title: string | null;
  description: string | null;
  isMain: boolean;
  displayOrder: number;
}

export interface HotelImageCreateDto {
  imageUrl: string;
  title?: string;
  description?: string;
  isMain?: boolean;
  displayOrder?: number;
}

// ========================
// Guider Types
// ========================
export interface GuiderCreateDto {
  name: string;
  contactInfo: string;
  languages: string[];
  experience?: string;
  active?: boolean;
  tourismPlaceId?: number;
}

export interface GuiderUpdateDto {
  name?: string;
  contactInfo?: string;
  languages?: string[];
  experience?: string;
  active?: boolean;
}

export interface Guider {
  id: number;
  name: string;
  contactInfo: string;
  languages: string[];
  experience?: string;
  active: boolean;
  createdAt: string;
}

// ========================
// Horse Service Types
// ========================
export interface HorseServiceCreateDto {
  ownerName: string;
  contactInfo: string;
  initialPlace: string;
  cost: number;
  roadInfoId: number;
}

export interface HorseServiceUpdateDto {
  ownerName?: string;
  contactInfo?: string;
  initialPlace?: string;
  cost?: number;
  roadInfoId?: number;
}

export interface HorseService {
  id: number;
  ownerName: string;
  contactInfo: string;
  initialPlace: string;
  cost: number;
  roadInfoId?: number;
  createdAt?: string;
}

// ========================
// Booking Types
// ========================
export interface Booking {
  id: number;
  hotelId: number;
  hotelName?: string;
  userId: number;
  userName?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  totalCost?: number;
  receiptUrl?: string;
  rejectionReason?: string;
  createdAt: string;
}

// ========================
// Road Types
// ========================
// Road Types
// ========================
export interface RoadCreateDto {
  tourismPlaceId: number;
  initialPlace: string;
  roadType?: string; // "CAR", "FOOT", "HORSE", "PLANE"
  description?: string;
  distanceByCar?: number;
  distanceByFoot?: number;
  distanceByPlane?: number;
  distanceByHorse?: number;
  totalDistance?: number;
}

export interface RoadUpdateDto {
  initialPlace?: string;
  roadType?: string;
  description?: string;
  distanceByCar?: number;
  distanceByFoot?: number;
  distanceByPlane?: number;
  distanceByHorse?: number;
  totalDistance?: number;
}

export interface Road {
  id: number;
  initialPlace: string;
  roadType: string;
  description?: string;
  distanceByCar?: number;
  distanceByFoot?: number;
  distanceByPlane?: number;
  distanceByHorse?: number;
  totalDistance?: number;
  tourismPlaceId?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ========================
// USER MANAGEMENT
// ========================
export class AdminUserService {
  static async getAllUsers(
    token: string, 
    page = 0, 
    size = 20, 
    sortBy = "id", 
    sortDir = "asc",
    search?: string
  ): Promise<UserListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDir,
    });
    if (search && search.trim()) {
      params.append("search", search.trim());
    }
    const response = await fetch(
      `${API_BASE_URL}/admin/users?${params.toString()}`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<UserListResponse>(response);
  }

  static async getUserById(token: string, userId: number): Promise<User> {
    const response = await fetch(
      `${API_BASE_URL}/admin/users/${userId}`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<User>(response);
  }

  static async getUsersByRole(token: string, role: string): Promise<User[]> {
    const response = await fetch(
      `${API_BASE_URL}/admin/users/role/${role}`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<User[]>(response);
  }

  static async activateUser(token: string, userId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/admin/users/${userId}/activate`,
      { method: "PATCH", headers: getAuthHeaders(token) }
    );
    return handleResponse<void>(response);
  }

  static async deactivateUser(token: string, userId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/admin/users/${userId}/deactivate`,
      { method: "PATCH", headers: getAuthHeaders(token) }
    );
    return handleResponse<void>(response);
  }

  static async deleteUser(token: string, userId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/admin/users/${userId}`,
      { method: "DELETE", headers: getAuthHeaders(token) }
    );
    return handleResponse<void>(response);
  }

  static async grantRole(token: string, userId: number, role: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/admin/users/${userId}/roles/${role}`,
      { method: "POST", headers: getAuthHeaders(token) }
    );
    return handleResponse<void>(response);
  }

  static async revokeRole(token: string, userId: number, role: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/admin/users/${userId}/roles/${role}`,
      { method: "DELETE", headers: getAuthHeaders(token) }
    );
    return handleResponse<void>(response);
  }
}

// ========================
// HOTEL MANAGEMENT
// ========================
export class AdminHotelService {
  // Backend: GET /api/admin/hotels
  static async getAllHotels(token: string, page = 0, size = 20): Promise<{ content: Hotel[]; totalElements: number; totalPages: number }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/hotels`,
        { headers: getAuthHeaders(token) }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error ${response.status}:`, errorText);
        throw new Error(errorText || `Request failed: ${response.status}`);
      }
      
      const contentType = response.headers.get("content-type");
      let data: any;
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        throw new Error("Response is not JSON");
      }
      
      console.log('🏨 Hotels raw data:', data);
      console.log('🏨 Is array?', Array.isArray(data));
      console.log('🏨 Data type:', typeof data);
      
      // Handle pagination on the frontend since backend returns a simple list
      let allHotels: Hotel[] = [];
      
      if (Array.isArray(data)) {
        allHotels = data;
        console.log('✅ Data is array with', allHotels.length, 'hotels');
      } else if (data && typeof data === 'object') {
        allHotels = data.content || [];
        console.log('✅ Data is object, content has', allHotels.length, 'hotels');
      }
      
      console.log('🏨 All hotels:', allHotels);
      console.log('🏨 First hotel:', allHotels[0]);
      
      const start = page * size;
      const end = start + size;
      const pageContent = allHotels.slice(start, end);
      const totalPages = Math.ceil(allHotels.length / size);
      
      console.log(`📄 Page ${page}: showing ${pageContent.length} items out of ${allHotels.length}`);
      
      return {
        content: pageContent,
        totalElements: allHotels.length,
        totalPages: totalPages
      };
    } catch (error) {
      console.error('❌ Error fetching hotels:', error);
      throw error;
    }
  }

  // Backend: GET /api/hotels/{id}/detail
  static async getHotelById(token: string, hotelId: number): Promise<Hotel> {
    const response = await fetch(
      `${API_BASE_URL}/hotels/${hotelId}/detail`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<Hotel>(response);
  }

  // Backend: POST /api/admin/hotels
  static async createHotel(token: string, data: HotelCreateDto): Promise<Hotel> {
    const response = await fetch(
      `${API_BASE_URL}/admin/hotels`,
      {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );
    const result = await handleResponse<Hotel>(response);
    console.log('✅ Hotel created successfully:', result);
    console.log('📷 Hotel images:', result.images);
    return result;
  }

  // Backend: PUT /api/admin/hotels/{id}
  static async updateHotel(token: string, hotelId: number, data: HotelUpdateDto): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/admin/hotels/${hotelId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );
    return handleResponse<void>(response);
  }

  // Backend: DELETE /api/admin/hotels/{id}
  static async deleteHotel(token: string, hotelId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/admin/hotels/${hotelId}`,
      { method: "DELETE", headers: getAuthHeaders(token) }
    );
    return handleResponse<void>(response);
  }

  // Backend: POST /api/admin/hotels/{id}/images
  static async addHotelImages(token: string, hotelId: number, images: string[], setMainImage?: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/admin/hotels/${hotelId}/images`,
      {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ images, setMainImage }),
      }
    );
    return handleResponse<void>(response);
  }

  // Backend: DELETE /api/admin/hotels/{id}/images/{imageId}
  static async deleteHotelImage(token: string, hotelId: number, imageId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/admin/hotels/${hotelId}/images/${imageId}`,
      { method: "DELETE", headers: getAuthHeaders(token) }
    );
    return handleResponse<void>(response);
  }

  // Backend: POST /api/admin/hotels/{hotelId}/owner/{userId}
  static async assignOwner(token: string, hotelId: number, userId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/admin/hotels/${hotelId}/owner/${userId}`,
      { method: "POST", headers: getAuthHeaders(token) }
    );
    return handleResponse<void>(response);
  }

  // Backend: DELETE /api/admin/hotels/{hotelId}/owner
  static async removeOwner(token: string, hotelId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/admin/hotels/${hotelId}/owner`,
      { method: "DELETE", headers: getAuthHeaders(token) }
    );
    return handleResponse<void>(response);
  }

  // Backend: PATCH /api/admin/hotels/{hotelId}/active?active={active}
  static async toggleActive(token: string, hotelId: number, active: boolean): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/admin/hotels/${hotelId}/active?active=${active}`,
      { method: "PATCH", headers: getAuthHeaders(token) }
    );
    return handleResponse<void>(response);
  }

  // Backend: GET /api/admin/hotels/{hotelId}/images
  static async getHotelImages(token: string, hotelId: number): Promise<HotelImage[]> {
    const response = await fetch(
      `${API_BASE_URL}/admin/hotels/${hotelId}/images`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<HotelImage[]>(response);
  }

  // Backend: POST /api/admin/hotels/{hotelId}/images
  static async addHotelImage(token: string, hotelId: number, data: HotelImageCreateDto): Promise<HotelImage> {
    const response = await fetch(
      `${API_BASE_URL}/admin/hotels/${hotelId}/images`,
      {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );
    return handleResponse<HotelImage>(response);
  }

  // Backend: PUT /api/admin/hotels/{hotelId}/images/{imageId}
  static async updateHotelImage(token: string, hotelId: number, imageId: number, data: HotelImageCreateDto): Promise<HotelImage> {
    const response = await fetch(
      `${API_BASE_URL}/admin/hotels/${hotelId}/images/${imageId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );
    return handleResponse<HotelImage>(response);
  }

  // Set main image using dedicated endpoint
  static async setMainHotelImage(token: string, hotelId: number, imageUrl: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/admin/hotels/${hotelId}/set-main-image`,
      {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ imageUrl }),
      }
    );
    return handleResponse<void>(response);
  }

  // Get the current main imageUrl for a hotel
  static async getHotelMainImageUrl(token: string, hotelId: number): Promise<string | null> {
    const images = await this.getHotelImages(token, hotelId);
    const mainImage = images.find(img => img.displayOrder === 0);
    return mainImage?.imageUrl || null;
  }
}

// ========================
// TOURISM MANAGEMENT
// ========================
export class AdminTourismService {
  // Backend: GET /api/admin/tourism/all - returns all tourism places with full details for admin page
  static async getAllTourism(token: string, page = 0, size = 20): Promise<{ content: Tourism[]; totalElements: number; totalPages: number }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/tourism/all`,
        { headers: getAuthHeaders(token) }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error ${response.status}:`, errorText);
        throw new Error(errorText || `Request failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 Tourism data received:', data);
      
      // Handle pagination on the frontend since backend returns a simple list
      const allTourisms = Array.isArray(data) ? data : (data.content || []);
      console.log('📋 All tourisms count:', allTourisms.length);
      
      const start = page * size;
      const end = start + size;
      const pageContent = allTourisms.slice(start, end);
      const totalPages = Math.ceil(allTourisms.length / size);
      
      console.log(`📄 Page ${page}: showing ${pageContent.length} items out of ${allTourisms.length}`);
      
      return {
        content: pageContent,
        totalElements: allTourisms.length,
        totalPages: totalPages
      };
    } catch (error) {
      console.error('❌ Error fetching tourisms:', error);
      throw error;
    }
  }

  // Backend: GET /api/admin/tourism/list - returns simple list for dropdowns
  static async getTourismListForDropdown(token: string): Promise<Tourism[]> {
    const response = await fetch(
      `${API_BASE_URL}/admin/tourism/list`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<Tourism[]>(response);
  }

  // Backend: GET /api/tourisms/{id}
  static async getTourismById(token: string, tourismId: number): Promise<Tourism> {
    const response = await fetch(
      `${API_BASE_URL}/tourisms/${tourismId}`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<Tourism>(response);
  }

  // Backend: POST /api/admin/tourism
  static async createTourism(token: string, data: TourismCreateDto): Promise<number> {
    // Ensure languages is an array (backend expects List<String>)
    const payload = {
      ...data,
      languages: Array.isArray(data.languages) ? data.languages : (data.languages ? String(data.languages).split(',').map(l => l.trim()) : [])
    };
    const response = await fetch(
      `${API_BASE_URL}/admin/tourism`,
      {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(payload),
      }
    );
    return handleResponse<number>(response);
  }

  // Backend: PUT /api/admin/tourism/{id}
  static async updateTourism(token: string, tourismId: number, data: TourismUpdateDto): Promise<void> {
    // Ensure languages is an array (backend expects List<String>)
    const payload = {
      ...data,
      languages: Array.isArray(data.languages) ? data.languages : (data.languages ? String(data.languages).split(',').map(l => l.trim()) : [])
    };
    const response = await fetch(
      `${API_BASE_URL}/admin/tourism/${tourismId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify(payload),
      }
    );
    return handleResponse<void>(response);
  }

  // Backend: DELETE /api/admin/tourism/{id}
  static async deleteTourism(token: string, tourismId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/admin/tourism/${tourismId}`,
      { method: "DELETE", headers: getAuthHeaders(token) }
    );
    return handleResponse<void>(response);
  }

  // ==============================
  // Tourism Image Management
  // ==============================

  // Backend: GET /api/admin/tourism/{tourismId}/images
  static async getTourismImages(token: string, tourismId: number): Promise<TourismImage[]> {
    const response = await fetch(
      `${API_BASE_URL}/admin/tourism/${tourismId}/images`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<TourismImage[]>(response);
  }

  // Backend: POST /api/admin/tourism/{tourismId}/images
  static async addTourismImage(token: string, tourismId: number, data: TourismImageCreateDto): Promise<TourismImage> {
    const response = await fetch(
      `${API_BASE_URL}/admin/tourism/${tourismId}/images`,
      {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );
    return handleResponse<TourismImage>(response);
  }

  // Backend: PUT /api/admin/tourism/{tourismId}/images/{imageId}
  static async updateTourismImage(token: string, tourismId: number, imageId: number, data: TourismImageCreateDto): Promise<TourismImage> {
    const response = await fetch(
      `${API_BASE_URL}/admin/tourism/${tourismId}/images/${imageId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );
    return handleResponse<TourismImage>(response);
  }

  // Backend: DELETE /api/admin/tourism/{tourismId}/images/{imageId}
  static async deleteTourismImage(token: string, tourismId: number, imageId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/admin/tourism/${tourismId}/images/${imageId}`,
      { method: "DELETE", headers: getAuthHeaders(token) }
    );
    return handleResponse<void>(response);
  }

  // Set main image by updating tourismPlace.imageUrl via PUT /api/admin/tourism/{tourismId}
  static async setMainTourismImage(token: string, tourismId: number, imageUrl: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/admin/tourism/${tourismId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ imageUrl }),
      }
    );
    return handleResponse<void>(response);
  }

  // Get the current main imageUrl for a tourism place
  static async getTourismMainImageUrl(token: string, tourismId: number): Promise<string | null> {
    const response = await fetch(
      `${API_BASE_URL}/admin/tourism/${tourismId}`,
      { headers: getAuthHeaders(token) }
    );
    const data = await handleResponse<{ imageUrl?: string }>(response);
    return data.imageUrl || null;
  }
}

// ========================
// GUIDER MANAGEMENT
// ========================
export class AdminGuiderService {
  static async getAllGuiders(token: string, tourismId?: number): Promise<{ content: Guider[]; totalElements: number; totalPages: number }> {
    // Backend returns guiders by tourism place
    if (tourismId) {
      const response = await fetch(
        `${API_BASE_URL}/guiders/tourism/${tourismId}`,
        { headers: getAuthHeaders(token) }
      );
      const data = await handleResponse<Guider[]>(response);
      return { content: data, totalElements: data.length, totalPages: 1 };
    }
    // Return empty if no tourismId - frontend should handle this
    return { content: [], totalElements: 0, totalPages: 0 };
  }

  static async getGuidersByTourism(token: string, tourismId: number): Promise<Guider[]> {
    const response = await fetch(
      `${API_BASE_URL}/guiders/tourism/${tourismId}`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<Guider[]>(response);
  }

  static async getGuiderById(token: string, guiderId: number): Promise<Guider> {
    const response = await fetch(
      `${API_BASE_URL}/guiders/${guiderId}`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<Guider>(response);
  }

  static async createGuider(token: string, data: GuiderCreateDto): Promise<number> {
    const response = await fetch(
      `${API_BASE_URL}/language-guiders`,
      {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );
    return handleResponse<number>(response);
  }

  static async updateGuider(token: string, guiderId: number, data: GuiderUpdateDto): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/language-guiders/${guiderId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );
    return handleResponse<void>(response);
  }

  static async deleteGuider(token: string, guiderId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/language-guiders/${guiderId}`,
      { method: "DELETE", headers: getAuthHeaders(token) }
    );
    return handleResponse<void>(response);
  }
}

// ========================
// ========================
// HORSE SERVICE MANAGEMENT
// ========================
export class AdminHorseServiceService {
  static async getAllHorseServices(token: string, roadId?: number): Promise<{ content: HorseService[]; totalElements: number; totalPages: number }> {
    // Backend returns list by road, so we need to fetch all roads first and aggregate
    // For now, if roadId is provided, fetch by road; otherwise return empty
    if (roadId) {
      const response = await fetch(
        `${API_BASE_URL}/roads/${roadId}/horse-services`,
        { headers: getAuthHeaders(token) }
      );
      const data = await handleResponse<HorseService[]>(response);
      return { content: data, totalElements: data.length, totalPages: 1 };
    }
    // Return empty if no roadId - frontend should handle this
    return { content: [], totalElements: 0, totalPages: 0 };
  }

  static async getHorseServicesByRoad(token: string, roadId: number): Promise<HorseService[]> {
    const response = await fetch(
      `${API_BASE_URL}/roads/${roadId}/horse-services`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<HorseService[]>(response);
  }

  static async getHorseServiceById(token: string, horseServiceId: number): Promise<HorseService> {
    const response = await fetch(
      `${API_BASE_URL}/horse-services/${horseServiceId}`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<HorseService>(response);
  }

  static async createHorseService(token: string, data: HorseServiceCreateDto): Promise<number> {
    const response = await fetch(
      `${API_BASE_URL}/horse-services`,
      {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );
    return handleResponse<number>(response);
  }

  static async updateHorseService(token: string, horseServiceId: number, data: HorseServiceUpdateDto): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/horse-services/${horseServiceId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );
    return handleResponse<void>(response);
  }

  static async deleteHorseService(token: string, horseServiceId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/horse-services/${horseServiceId}`,
      { method: "DELETE", headers: getAuthHeaders(token) }
    );
    return handleResponse<void>(response);
  }
}

// ========================
// BOOKING MANAGEMENT
// ========================
export class AdminBookingService {
  // Backend: GET /api/bookings/admin/all
  static async getAllBookings(token: string, page = 0, size = 20): Promise<{ content: Booking[]; totalElements: number; totalPages: number }> {
    const response = await fetch(
      `${API_BASE_URL}/bookings/admin/all?page=${page}&size=${size}`,
      { headers: getAuthHeaders(token) }
    );
    const data = await handleResponse<{ content: any[]; totalElements: number; totalPages: number }>(response);
    
    // Transform backend response to match frontend Booking interface
    const transformedContent = (data.content || []).map((b: any) => {
      // Handle both transformed and raw formats
      if (b.bookingId) {
        // Already transformed
        return b;
      }
      
      // Transform from backend format
      return {
        bookingId: b.id,
        hotel: b.hotel ? {
          id: b.hotel.id,
          name: b.hotel.name,
          contactInfo: b.hotel.contactInfo,
          active: b.hotel.active,
          ownerName: b.hotel.owner?.fullName,
        } : null,
        client: b.user ? {
          id: b.user.id,
          fullName: b.user.fullName,
          username: b.user.username,
          email: b.user.email,
          phone: b.clientPhone,
        } : null,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        numberOfGuests: b.numberOfGuests,
        numberOfRooms: b.numberOfRooms,
        specialRequests: b.specialRequests,
        bookingStatus: b.status?.name || 'UNKNOWN',
        totalCost: b.totalCost,
        receiptImageUrl: b.receiptImageUrl,
        rejectionReason: b.rejectionReason,
        problemReport: b.problemReport,
        problemReported: b.problemReported,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        messages: b.messages || [],
      };
    });
    
    return { 
      content: transformedContent, 
      totalElements: data.totalElements, 
      totalPages: data.totalPages 
    };
  }

  // Backend: GET /api/bookings/{id}?userId={userId}
  static async getBookingById(token: string, bookingId: number, userId: number): Promise<Booking> {
    const response = await fetch(
      `${API_BASE_URL}/bookings/${bookingId}?userId=${userId}`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<Booking>(response);
  }

  // Backend: GET /api/bookings/admin/problems
  static async getProblemBookings(token: string): Promise<Booking[]> {
    const response = await fetch(
      `${API_BASE_URL}/bookings/admin/problems`,
      { headers: getAuthHeaders(token) }
    );
    const data = await handleResponse<any[]>(response);
    
    // Transform backend response to match frontend Booking interface
    return (data || []).map((b: any) => {
      // Handle both transformed and raw formats
      if (b.bookingId) {
        // Already transformed
        return b;
      }
      
      // Transform from backend format
      return {
        bookingId: b.id,
        hotel: b.hotel ? {
          id: b.hotel.id,
          name: b.hotel.name,
          contactInfo: b.hotel.contactInfo,
          active: b.hotel.active,
          ownerName: b.hotel.owner?.fullName,
        } : null,
        client: b.user ? {
          id: b.user.id,
          fullName: b.user.fullName,
          username: b.user.username,
          email: b.user.email,
          phone: b.clientPhone,
        } : null,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        numberOfGuests: b.numberOfGuests,
        numberOfRooms: b.numberOfRooms,
        specialRequests: b.specialRequests,
        bookingStatus: b.status?.name || 'UNKNOWN',
        totalCost: b.totalCost,
        receiptImageUrl: b.receiptImageUrl,
        rejectionReason: b.rejectionReason,
        problemReport: b.problemReport,
        problemReported: b.problemReported,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        messages: b.messages || [],
      };
    });
  }

  // Backend: POST /api/bookings/{id}/cost?cost={cost}&ownerId={ownerId}
  static async proposeCost(token: string, bookingId: number, cost: number, ownerId: number): Promise<Booking> {
    const response = await fetch(
      `${API_BASE_URL}/bookings/${bookingId}/cost?cost=${cost}&ownerId=${ownerId}`,
      { method: "POST", headers: getAuthHeaders(token) }
    );
    return handleResponse<Booking>(response);
  }

  // Backend: POST /api/bookings/{id}/approve?ownerId={ownerId}
  static async approveBooking(token: string, bookingId: number, ownerId: number): Promise<Booking> {
    const response = await fetch(
      `${API_BASE_URL}/bookings/${bookingId}/approve?ownerId=${ownerId}`,
      { method: "POST", headers: getAuthHeaders(token) }
    );
    return handleResponse<Booking>(response);
  }

  // Backend: POST /api/bookings/{id}/reject?reason={reason}&ownerId={ownerId}
  static async rejectBooking(token: string, bookingId: number, reason: string, ownerId: number): Promise<Booking> {
    const response = await fetch(
      `${API_BASE_URL}/bookings/${bookingId}/reject?reason=${encodeURIComponent(reason)}&ownerId=${ownerId}`,
      { method: "POST", headers: getAuthHeaders(token) }
    );
    return handleResponse<Booking>(response);
  }

  // Backend: POST /api/bookings/admin/{id}/resolve
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
}

// ========================
// ROAD MANAGEMENT
// ========================
export class AdminRoadService {
  static async getAllRoads(token: string, tourismId?: number): Promise<{ content: Road[]; totalElements: number; totalPages: number }> {
    // Backend returns roads by tourism place
    if (tourismId) {
      const response = await fetch(
        `${API_BASE_URL}/tourisms/${tourismId}/roads`,
        { headers: getAuthHeaders(token) }
      );
      const data = await handleResponse<Road[]>(response);
      return { content: data, totalElements: data.length, totalPages: 1 };
    }
    // Return empty if no tourismId - frontend should handle this
    return { content: [], totalElements: 0, totalPages: 0 };
  }

  static async getRoadsByTourism(token: string, tourismId: number): Promise<Road[]> {
    const response = await fetch(
      `${API_BASE_URL}/tourisms/${tourismId}/roads`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<Road[]>(response);
  }

  static async getRoadById(token: string, roadId: number): Promise<Road> {
    const response = await fetch(
      `${API_BASE_URL}/roads/${roadId}`,
      { headers: getAuthHeaders(token) }
    );
    return handleResponse<Road>(response);
  }

  static async createRoad(token: string, data: RoadCreateDto): Promise<number> {
    const response = await fetch(
      `${API_BASE_URL}/roads`,
      {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );
    return handleResponse<number>(response);
  }

  static async updateRoad(token: string, roadId: number, data: RoadUpdateDto): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/roads/${roadId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );
    return handleResponse<void>(response);
  }

  static async deleteRoad(token: string, roadId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/roads/${roadId}`,
      { method: "DELETE", headers: getAuthHeaders(token) }
    );
    return handleResponse<void>(response);
  }
}

// ========================
// IMAGE UPLOAD SERVICE
// ========================
export class AdminImageUploadService {
  private static async uploadFile(token: string, url: string, file: File, extraFields?: Record<string, string>): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);
    if (extraFields) {
      Object.entries(extraFields).forEach(([k, v]) => formData.append(k, v));
    }
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || 'Upload failed');
    }
    const data = await response.json();
    return data.imageUrl;
  }

  // Upload tourism main image
  static async uploadTourismMainImage(token: string, tourismId: number, file: File): Promise<string> {
    return this.uploadFile(token, `${API_BASE_URL}/admin/tourism/${tourismId}/main-image/upload`, file);
  }

  // Upload tourism gallery image
  static async uploadTourismGalleryImage(token: string, tourismId: number, file: File, title?: string, description?: string): Promise<string> {
    return this.uploadFile(token, `${API_BASE_URL}/admin/tourism/${tourismId}/images/upload`, file, {
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
    });
  }

  // Upload hotel main image
  static async uploadHotelMainImage(token: string, hotelId: number, file: File): Promise<string> {
    return this.uploadFile(token, `${API_BASE_URL}/admin/hotels/${hotelId}/main-image/upload`, file);
  }

  // Upload hotel gallery image
  static async uploadHotelGalleryImage(token: string, hotelId: number, file: File, title?: string, description?: string): Promise<string> {
    return this.uploadFile(token, `${API_BASE_URL}/admin/hotels/${hotelId}/images/upload`, file, {
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
    });
  }

  // Upload hero image (creates new hero image record)
  static async uploadHeroImage(token: string, file: File, title?: string, description?: string, displayOrder?: number, active?: boolean): Promise<{ imageUrl: string; id: number }> {
    const formData = new FormData();
    formData.append('image', file);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    if (displayOrder !== undefined) formData.append('displayOrder', String(displayOrder));
    if (active !== undefined) formData.append('active', String(active));
    const response = await fetch(`${API_BASE_URL}/admin/hero-images/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || 'Upload failed');
    }
    return response.json();
  }

  // Update hero image with optional new file
  static async updateHeroImageWithUpload(token: string, id: number, file: File | null, fields: { title?: string; description?: string; displayOrder?: number; active?: boolean }): Promise<any> {
    const formData = new FormData();
    if (file) formData.append('image', file);
    if (fields.title !== undefined) formData.append('title', fields.title);
    if (fields.description !== undefined) formData.append('description', fields.description);
    if (fields.displayOrder !== undefined) formData.append('displayOrder', String(fields.displayOrder));
    if (fields.active !== undefined) formData.append('active', String(fields.active));
    const response = await fetch(`${API_BASE_URL}/admin/hero-images/${id}/upload`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || 'Update failed');
    }
    return response.json();
  }
}
