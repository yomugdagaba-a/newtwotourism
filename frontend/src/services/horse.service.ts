// frontend/src/services/horse.service.ts
import { HorseServiceSummaryDto } from "@/types/horse";
import { API_BASE_URL } from "./api";

// Get horse services by road ID
// Backend: GET /api/roads/{roadId}/horse-services
export async function getHorseServicesByRoad(
  roadId: number,
  token?: string
): Promise<HorseServiceSummaryDto[]> {
  const url = `${API_BASE_URL}/roads/${roadId}/horse-services`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      console.error(`Failed to fetch horse services for road ${roadId}:`, await res.text());
      return [];
    }

    const data: HorseServiceSummaryDto[] = await res.json();
    return data ?? [];
  } catch (err) {
    console.error(`Horse services by road fetch failed (roadId=${roadId}):`, err);
    return [];
  }
}

// Get horse service by ID
// Backend: GET /api/horse-services/{id}
export async function getHorseServiceById(
  id: number,
  token?: string
): Promise<HorseServiceSummaryDto | null> {
  const url = `${API_BASE_URL}/horse-services/${id}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      console.error(`Failed to fetch horse service ${id}:`, await res.text());
      return null;
    }

    return res.json();
  } catch (err) {
    console.error(`Horse service fetch failed (id=${id}):`, err);
    return null;
  }
}

export default {
  getHorseServicesByRoad,
  getHorseServiceById,
};

// Get horse services by tourism place ID
export async function getHorseServicesByTourism(
  tourismId: number,
  token?: string
): Promise<HorseServiceSummaryDto[]> {
  const url = `${API_BASE_URL}/tourism/${tourismId}/horse-services`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) return [];
    const data: HorseServiceSummaryDto[] = await res.json();
    return data ?? [];
  } catch (err) {
    console.error(`Horse services by tourism fetch failed (tourismId=${tourismId}):`, err);
    return [];
  }
}
