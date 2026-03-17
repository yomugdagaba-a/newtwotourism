/** Booking DTOs */

const CreateBookingDto = {
  hotelId: { required: true, type: 'number' },
  checkIn: { required: true, type: 'string' },
  checkOut: { required: true, type: 'string' },
  numberOfGuests: { required: true, type: 'number', min: 1 },
};

const UpdateBookingDto = {
  checkIn: { type: 'string' },
  checkOut: { type: 'string' },
  numberOfGuests: { type: 'number', min: 1 },
  specialRequests: { type: 'string' },
};

module.exports = { CreateBookingDto, UpdateBookingDto };
