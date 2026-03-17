export class NearbyTourismDto {
  id: number;
  name: string;
  imageUrl?: string;

  constructor(id: number, name: string, imageUrl?: string) {
    this.id = id;
    this.name = name;
    this.imageUrl = imageUrl;
  }

  static fromEntity(place: any): NearbyTourismDto {
    return new NearbyTourismDto(
      place.id,
      place.name,
      place.images && place.images.length > 0 ? place.images[0].imageUrl : null,
    );
  }
}
