/** Hotel DTOs */

class HotelDto {
  static get CreateHotelDto() {
    return {
      name: { required: true, type: 'string', minLength: 2 },
      starRating: { required: true, type: 'number', min: 1, max: 5 },
      contactInfo: { required: true, type: 'string' },
      policies: { type: 'string' },
      description: { type: 'string' },
      tourismPlaceId: { type: 'number' },
      active: { type: 'boolean' },
      mainImageUrl: { type: 'string' },
      images: { type: 'array' },
    };
  }

  static get UpdateHotelDto() {
    return {
      name: { type: 'string', minLength: 2 },
      starRating: { type: 'number', min: 1, max: 5 },
      contactInfo: { type: 'string' },
      policies: { type: 'string' },
      description: { type: 'string' },
      tourismPlaceId: { type: 'number' },
      active: { type: 'boolean' },
      mainImageUrl: { type: 'string' },
      images: { type: 'array' },
    };
  }
}

// Export both class and individual DTOs for backward compatibility
module.exports = { 
  HotelDto,
  CreateHotelDto: HotelDto.CreateHotelDto, 
  UpdateHotelDto: HotelDto.UpdateHotelDto 
};
