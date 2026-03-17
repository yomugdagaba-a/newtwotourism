import { API_BASE_URL } from "./api";
import { TourismImageDto } from "@/types/tourismImage";

// Public endpoint to get tourism images
export async function getTourismImages(tourismId: number): Promise<TourismImageDto[]> {
  try {
    console.log(`Fetching internal images for tourism ${tourismId} from ${API_BASE_URL}/tourisms/${tourismId}/images`);
    const response = await fetch(`${API_BASE_URL}/tourisms/${tourismId}/images`);
    
    if (!response.ok) {
      // Return empty array if no images found or error
      console.warn(`No images found for tourism ${tourismId}, status: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    console.log(`Loaded ${data.length} internal images for tourism ${tourismId}:`, data);
    return data;
  } catch (error) {
    console.warn(`Failed to fetch tourism images for ${tourismId}:`, error);
    return [];
  }
}
