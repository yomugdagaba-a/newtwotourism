export interface TourismImageDto {
  id: number;
  imageUrl: string;
  title: string | null;
  description: string | null;
  isMain: boolean;
  displayOrder: number;
}

export interface TourismImageCreateDto {
  imageUrl: string;
  title?: string;
  description?: string;
  isMain?: boolean;
  displayOrder?: number;
}
