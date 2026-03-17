import { RatingDto } from "@/types/rating";

export const hasUserRated = (ratings: RatingDto[], username?: string | null) => {
  if (!username) return false;
  return ratings.some(r => r.username === username);
};
