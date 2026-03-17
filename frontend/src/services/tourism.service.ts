import { api, API_BASE_URL } from "./api";
import { TourismFullDetailDto } from "@/types/tourism";

// ========================
// Pagination interface – matches Spring Boot Page<T>
// ========================
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

// ========================
// Tourism card – homepage / listing
// ========================
export interface TourismPublicCardDto {
  id?: number;
  name: string;
  imageUrl?: string;
  viewersCount: number;
  category?: string;
  wereda?: string;
  kebele?: string;
  description?: string;
}

export type TourismPublicCard = TourismPublicCardDto;

interface FetchParams {
  categories?: string[];
  keyword?: string;
  wereda?: string;
  kebele?: string;
  page?: number;
  size?: number;
}

// ========================
// Fetch homepage tourism
// ========================
export const fetchHomepageTourism = async (categories: string[]): Promise<TourismPublicCard[]> => {
  const query = new URLSearchParams();
  categories.forEach((c) => query.append("categories", c));

  const response = await fetch(`${API_BASE_URL}/tourisms/public/homepage?${query.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch homepage tourism: ${response.status}`);
  }

  return response.json();
};

// ========================
// Fetch tourism search / listing page
// ========================
export const fetchTourismPlaces = async (params: Partial<FetchParams> = {}): Promise<Page<TourismPublicCard>> => {
  const {
    categories = [],
    keyword = "",
    wereda = "",
    kebele = "",
    page = 0,
    size = 12,
    sortBy = "name",
    sortDir = "asc",
  } = params as FetchParams & { sortBy?: string; sortDir?: string };

  const queryParams = new URLSearchParams();

  categories.forEach(c => queryParams.append("categories", c));
  if (keyword.trim()) queryParams.append("keyword", keyword.trim());
  if (wereda.trim()) queryParams.append("wereda", wereda.trim());
  if (kebele.trim()) queryParams.append("kebele", kebele.trim());
  
  // Add pagination and sorting params
  queryParams.append("page", page.toString());
  queryParams.append("size", size.toString());
  queryParams.append("sortBy", sortBy);
  queryParams.append("sortDir", sortDir);

  const queryString = queryParams.toString();
  
  const response = await fetch(`${API_BASE_URL}/tourisms/public/search${queryString ? `?${queryString}` : ''}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }

  // Backend now returns Page<T> directly
  return response.json();
};

// ========================
// Tourism detail DTOs
// ========================
export interface NearbyTourismDto {
  id: number;
  name: string;
  imageUrl?: string;
  category?: string;
  wereda?: string;
}

export interface RatingSummaryResponseDto {
  avgRating: number;
  totalRatings: number;
}

export interface TourismRatingResponseDto {
  id: number;
  rating: number;
  comment?: string;
  userFullName: string;
  createdAt: string;
}

// TourismFullDetailDto is imported from @/types/tourism

// ========================
// Fetch tourism detail (auth + public fallback)
// ========================
export const fetchTourismDetail = async (tourismId: number, token?: string): Promise<TourismFullDetailDto> => {
  if (token) {
    try {
      const res = await api.get<TourismFullDetailDto>(`/user/tourism/${tourismId}/details`, token);
      return res as unknown as TourismFullDetailDto;
    } catch (err: any) {
      if (err?.status !== 401 && err?.status !== 403) throw err;
    }
  }

  const fallback = await api.get<TourismFullDetailDto>(`/tourisms/${tourismId}`);
  return fallback as unknown as TourismFullDetailDto;
};

// ========================
// Submit tourism rating
// ========================
export interface TourismRatingRequestDto {
  rating: number;
  comment?: string;
}

export const submitTourismRating = async (
  tourismId: number,
  rating: number,
  comment: string | undefined,
  token: string
): Promise<TourismRatingResponseDto> => {
  const payload: TourismRatingRequestDto = { rating, comment };
  const res = await api.post<TourismRatingResponseDto>(`/tourisms/${tourismId}/rate`, payload, token);
  return res as unknown as TourismRatingResponseDto;
};
