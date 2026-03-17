package com.northwollo.tourism.service;

import com.northwollo.tourism.dto.request.BookingRequestDto;
import com.northwollo.tourism.dto.response.HotelBookingResponseDto;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

public interface BookingService {

    // Client operations
    HotelBookingResponseDto createBooking(BookingRequestDto dto, Long userId);
    List<HotelBookingResponseDto> getMyBookings(Long userId);
    HotelBookingResponseDto getBookingById(Long bookingId, Long userId);
    HotelBookingResponseDto uploadReceipt(Long bookingId, String receiptUrl, Long userId);
    HotelBookingResponseDto uploadReceiptFile(Long bookingId, MultipartFile file, Long userId);
    HotelBookingResponseDto reportProblem(Long bookingId, String problemDescription, Long userId);
    HotelBookingResponseDto sendMessage(Long bookingId, String message, Long userId);

    // Hotel Owner operations
    List<HotelBookingResponseDto> getHotelBookings(Long hotelId, Long ownerId);
    List<HotelBookingResponseDto> getOwnerBookings(Long ownerId);
    HotelBookingResponseDto acceptBookingRequest(Long bookingId, Long ownerId);
    HotelBookingResponseDto proposeCost(Long bookingId, BigDecimal cost, Long ownerId);
    HotelBookingResponseDto approveBooking(Long bookingId, Long ownerId);
    HotelBookingResponseDto rejectBooking(Long bookingId, String reason, Long ownerId);
    HotelBookingResponseDto ownerSendMessage(Long bookingId, String message, Long ownerId);

    // Admin operations
    List<HotelBookingResponseDto> getAllBookings(int page, int size);
    List<HotelBookingResponseDto> getProblemBookings();
    HotelBookingResponseDto adminResolve(Long bookingId, String resolution);
}
