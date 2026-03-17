// src/services/search.service.ts
import { TourismPublicCardDto } from "./tourism.service";
import { API_BASE_URL } from "./api";

interface SearchParams {
  categories?: string[];
  keyword?: string;
  wereda?: string;
  kebele?: string;
  page?: number;
  size?: number;
}

export async function searchTourismPlaces(params: SearchParams): Promise<TourismPublicCardDto[]> {
  const query = new URLSearchParams();

  if (params.categories) params.categories.forEach((c) => query.append("categories", c));
  if (params.keyword) query.append("keyword", params.keyword);
  if (params.wereda) query.append("wereda", params.wereda);
  if (params.kebele) query.append("kebele", params.kebele);
  if (params.page !== undefined) query.append("page", params.page.toString());
  if (params.size !== undefined) query.append("size", params.size.toString());

  const res = await fetch(`${API_BASE_URL}/tourisms/public/search?${query.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to search tourism places");
  }

  return res.json();
}
