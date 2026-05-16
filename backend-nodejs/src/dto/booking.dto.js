/** Booking DTOs */

class BookingDto {
  static get CreateBookingDto() {
    return {
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
  }

  static get UpdateBookingDto() {
    return {
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
  }
}

// Export both class and individual DTOs for backward compatibility
module.exports = { 
  BookingDto,
  CreateBookingDto: BookingDto.CreateBookingDto, 
  UpdateBookingDto: BookingDto.UpdateBookingDto 
};
