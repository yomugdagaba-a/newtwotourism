/** Booking DTOs */

const CreateBookingDto = {
  hotelId: { required: true, type: 'number' },
  checkIn: { required: true, type: 'string' },
  checkOut: { required: true, type: 'string' },
  numberOfGuests: { required: true, type: 'number', min: 1 },
  numberOfRooms: { type: 'number', min: 1 },
  specialRequests: { type: 'string' },
  clientPhone: { type: 'string' },
  clientEmail: { isEmail: true },
  totalCost: { type: 'number' },
  receiptImageUrl: { type: 'string' },
  rejectionReason: { type: 'string' },
  problemReport: { type: 'string' },
  problemReported: { type: 'boolean' },
};

const UpdateBookingDto = {
  checkIn: { type: 'string' },
  checkOut: { type: 'string' },
  numberOfGuests: { type: 'number', min: 1 },
  numberOfRooms: { type: 'number', min: 1 },
  specialRequests: { type: 'string' },
  clientPhone: { type: 'string' },
  clientEmail: { isEmail: true },
  totalCost: { type: 'number' },
  receiptImageUrl: { type: 'string' },
  rejectionReason: { type: 'string' },
  problemReport: { type: 'string' },
  problemReported: { type: 'boolean' },
};

module.exports = { CreateBookingDto, UpdateBookingDto };
