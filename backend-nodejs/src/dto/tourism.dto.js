/** Tourism DTOs */

const VALID_CATEGORIES = ['HERITAGE', 'HIGHLAND', 'CAVERN', 'AQUATICS', 'CULTURE', 'MODERN'];
const VALID_STATUSES = ['ACTIVE', 'INACTIVE', 'PENDING'];

class TourismDto {
  static get VALID_CATEGORIES() {
    return VALID_CATEGORIES;
  }

  static get VALID_STATUSES() {
    return VALID_STATUSES;
  }

  static get CreateTourismDto() {
    return {
      name: { required: true, type: 'string', minLength: 2 },
      categories: { required: true, type: 'array', isEnumArray: VALID_CATEGORIES },
      description: { required: true, type: 'string' },
      wereda: { required: true, type: 'string' },
      kebele: { required: true, type: 'string' },
      bestTime: { type: 'string' },
      peaceInfo: { type: 'string' },
      visitTime: { type: 'number' },
      languages: { type: 'array' },
      status: { isEnum: VALID_STATUSES },
      imageUrl: { type: 'string' },
      images: { type: 'array' },
    };
  }

  static get UpdateTourismDto() {
    return {
      name: { type: 'string', minLength: 2 },
      categories: { type: 'array', isEnumArray: VALID_CATEGORIES },
      description: { type: 'string' },
      wereda: { type: 'string' },
      kebele: { type: 'string' },
      bestTime: { type: 'string' },
      peaceInfo: { type: 'string' },
      visitTime: { type: 'number' },
      languages: { type: 'array' },
      status: { isEnum: VALID_STATUSES },
      imageUrl: { type: 'string' },
      images: { type: 'array' },
    };
  }
}

// Export both class and individual items for backward compatibility
module.exports = { 
  TourismDto,
  CreateTourismDto: TourismDto.CreateTourismDto, 
  UpdateTourismDto: TourismDto.UpdateTourismDto, 
  VALID_CATEGORIES, 
  VALID_STATUSES 
};
