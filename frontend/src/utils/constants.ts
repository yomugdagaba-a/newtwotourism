// frontend/src/utils/constants.ts

export const TOAST_SUCCESS = "success";
export const TOAST_ERROR = "error";

export const DEFAULT_PAGE_SIZE = 10;

export const TOURISM_CATEGORIES = [
  "HERITAGE",
    "HIGHLAND",
    "CAVERN",
    "AQUATICS",
    "CULTURE",
    "MODERN"
] as const;

export type TourismCategory = typeof TOURISM_CATEGORIES[number];
