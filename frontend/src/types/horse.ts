// frontend/src/types/horse.ts

export interface HorseServiceSummaryDto {
  id: number;            // Unique horse service ID
  ownerName: string;     // Name of the service owner
  contactInfo: string;   // Contact phone/email
  initialPlace: string;  // Location / starting place
  cost: number;          // Service cost in ETB
}
