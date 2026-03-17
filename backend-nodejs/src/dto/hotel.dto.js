/** Hotel DTOs */

const CreateHotelDto = {
  name: { required: true, type: 'string', minLength: 2 },
  starRating: { required: true, type: 'number', min: 1, max: 5 },
  contactInfo: { required: true, type: 'string' },
};

const UpdateHotelDto = {
  name: { type: 'string', minLength: 2 },
  starRating: { type: 'number', min: 1, max: 5 },
  contactInfo: { type: 'string' },
};

module.exports = { CreateHotelDto, UpdateHotelDto };
