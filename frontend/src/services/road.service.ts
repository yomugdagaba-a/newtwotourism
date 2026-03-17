import { RoadInfoDto } from "@/types/road";
import { API_BASE_URL } from "./api";

export async function getRoadsByTourism(tourismId: number): Promise<RoadInfoDto[]> {
  const url = `${API_BASE_URL}/tourisms/${tourismId}/roads`;
  console.log("🌐 Fetching roads from:", url);
  
  const res = await fetch(url);
  console.log("📡 Roads response status:", res.status);
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ Roads API Error:", errorText);
    throw new Error(`Failed to fetch roads: ${res.status}`);
  }
  
  const data = await res.json();
  console.log("✅ Roads loaded:", data.length);
  return data;
}

export async function getRoadById(roadId: number): Promise<RoadInfoDto> {
  const url = `${API_BASE_URL}/roads/${roadId}`;
  console.log("🌐 Fetching road by id:", url);

  const res = await fetch(url);
  if (!res.ok) {
    const errText = await res.text();
    console.error("❌ Road API Error:", errText);
    throw new Error(`Failed to fetch road ${roadId}: ${res.status}`);
  }

  const data = await res.json();
  return data as RoadInfoDto;
}

export default {
  getRoadsByTourism,
};
