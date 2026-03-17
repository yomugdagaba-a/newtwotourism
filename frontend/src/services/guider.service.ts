// frontend/src/services/guider.service.ts

import { API_BASE_URL } from "./api";
import { LanguageGuiderDto } from "@/types/guider";

export async function getGuidersByTourism(tourismPlaceId: number): Promise<LanguageGuiderDto[]> {
  const response = await fetch(`${API_BASE_URL}/guiders/tourism/${tourismPlaceId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch guiders");
  }
  return response.json();
}

export async function getGuiderById(guiderId: number): Promise<LanguageGuiderDto> {
  const response = await fetch(`${API_BASE_URL}/guiders/${guiderId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch guider");
  }
  return response.json();
}
