package com.northwollo.tourism.controller;

import com.northwollo.tourism.dto.request.BookingRequestDto;
import com.northwollo.tourism.dto.response.HotelBookingResponseDto;
import com.northwollo.tourism.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    // ==================== CLIENT ENDPOINTS ====================

    @PostMapping
    public ResponseEntity<HotelBookingResponseDto> createBooking(
            @Valid @RequestBody BookingRequestDto dto,
            @RequestParam Long userId) {
        return ResponseEntity.ok(bookingService.createBooking(dto, userId));
    }

    @GetMapping("/my")
    public ResponseEntity<List<HotelBookingResponseDto>> getMyBookings(@RequestParam Long userId) {
        return ResponseEntity.ok(bookingService.getMyBookings(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<HotelBookingResponseDto> getBookingById(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return ResponseEntity.ok(bookingService.getBookingById(id, userId));
    }

    @PostMapping("/{id}/receipt")
    public ResponseEntity<HotelBookingResponseDto> uploadReceipt(
            @PathVariable Long id,
            @RequestParam String receiptUrl,
            @RequestParam Long userId) {
        return ResponseEntity.ok(bookingService.uploadReceipt(id, receiptUrl, userId));
    }

    @PostMapping(value = "/{id}/receipt/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<HotelBookingResponseDto> uploadReceiptFile(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam Long userId) {
        return ResponseEntity.ok(bookingService.uploadReceiptFile(id, file, userId));
    }

    @PostMapping("/{id}/problem")
    public ResponseEntity<HotelBookingResponseDto> reportProblem(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestParam Long userId) {
        return ResponseEntity.ok(bookingService.reportProblem(id, body.get("problem"), userId));
    }

    @PostMapping("/{id}/message")
    public ResponseEntity<HotelBookingResponseDto> sendMessage(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestParam Long userId) {
        return ResponseEntity.ok(bookingService.sendMessage(id, body.get("message"), userId));
    }

    // ==================== HOTEL OWNER ENDPOINTS ====================

    @GetMapping("/hotel/{hotelId}")
    @PreAuthorize("hasRole('HOTEL_OWNER') or hasRole('ADMIN')")
    public ResponseEntity<List<HotelBookingResponseDto>> getHotelBookings(
            @PathVariable Long hotelId,
            @RequestParam Long ownerId) {
        return ResponseEntity.ok(bookingService.getHotelBookings(hotelId, ownerId));
    }

    @GetMapping("/owner")
    @PreAuthorize("hasRole('HOTEL_OWNER') or hasRole('ADMIN')")
    public ResponseEntity<List<HotelBookingResponseDto>> getOwnerBookings(@RequestParam Long ownerId) {
        return ResponseEntity.ok(bookingService.getOwnerBookings(ownerId));
    }

    @PostMapping("/{id}/accept")
    @PreAuthorize("hasRole('HOTEL_OWNER') or hasRole('ADMIN')")
    public ResponseEntity<HotelBookingResponseDto> acceptBookingRequest(
            @PathVariable Long id,
            @RequestParam Long ownerId) {
        return ResponseEntity.ok(bookingService.acceptBookingRequest(id, ownerId));
    }

    @PostMapping("/{id}/cost")
    @PreAuthorize("hasRole('HOTEL_OWNER') or hasRole('ADMIN')")
    public ResponseEntity<HotelBookingResponseDto> proposeCost(
            @PathVariable Long id,
            @RequestParam BigDecimal cost,
            @RequestParam Long ownerId) {
        return ResponseEntity.ok(bookingService.proposeCost(id, cost, ownerId));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('HOTEL_OWNER') or hasRole('ADMIN')")
    public ResponseEntity<HotelBookingResponseDto> approveBooking(
            @PathVariable Long id,
            @RequestParam Long ownerId) {
        return ResponseEntity.ok(bookingService.approveBooking(id, ownerId));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('HOTEL_OWNER') or hasRole('ADMIN')")
    public ResponseEntity<HotelBookingResponseDto> rejectBooking(
            @PathVariable Long id,
            @RequestParam String reason,
            @RequestParam Long ownerId) {
        return ResponseEntity.ok(bookingService.rejectBooking(id, reason, ownerId));
    }

    @PostMapping("/{id}/owner-message")
    @PreAuthorize("hasRole('HOTEL_OWNER') or hasRole('ADMIN')")
    public ResponseEntity<HotelBookingResponseDto> ownerSendMessage(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestParam Long ownerId) {
        return ResponseEntity.ok(bookingService.ownerSendMessage(id, body.get("message"), ownerId));
    }

    // ==================== ADMIN ENDPOINTS ====================

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<HotelBookingResponseDto>> getAllBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(bookingService.getAllBookings(page, size));
    }

    @GetMapping("/admin/problems")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<HotelBookingResponseDto>> getProblemBookings() {
        return ResponseEntity.ok(bookingService.getProblemBookings());
    }

    @PostMapping("/admin/{id}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HotelBookingResponseDto> adminResolve(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(bookingService.adminResolve(id, body.get("resolution")));
    }
}
