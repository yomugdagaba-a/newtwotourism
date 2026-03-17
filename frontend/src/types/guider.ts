// frontend/src/types/guider.ts

export interface LanguageGuiderDto {
  id: number;
  name?: string;
  fullName?: string;
  contactInfo: string;
  languages: string[];
  active: boolean;
  experience?: string;
  tourismPlaceId?: number;
  tourismPlaceName?: string;
}
