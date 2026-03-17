/** Hotel DTOs */

const CreateHotelDto = {
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

const UpdateHotelDto = {
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

module.exports = { CreateHotelDto, UpdateHotelDto };
