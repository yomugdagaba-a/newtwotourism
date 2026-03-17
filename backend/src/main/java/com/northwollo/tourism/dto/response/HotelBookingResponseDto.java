package com.northwollo.tourism.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class HotelBookingResponseDto {

    private Long bookingId;

    // Nested hotel info
    private HotelDto hotel;

    // Nested client info
    private ClientDto client;

    private LocalDate checkIn;
    private LocalDate checkOut;
    private Integer numberOfGuests;
    private Integer numberOfRooms;
    private String specialRequests;

    private String bookingStatus;
    private BigDecimal totalCost;
    private String receiptImageUrl;
    private String rejectionReason;
    
    private String problemReport;
    private boolean problemReported;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Messages for this booking
    private List<MessageDto> messages;

    @Data
    @Builder
    public static class HotelDto {
        private Long id;
        private String name;
        private String contactInfo;
        private boolean active;
        private Long ownerId;
        private String ownerName;
    }

    @Data
    @Builder
    public static class ClientDto {
        private Long id;
        private String username;
        private String fullName;
        private String email;
        private String phone;
    }

    @Data
    @Builder
    public static class MessageDto {
        private Long id;
        private Long senderId;
        private String senderName;
        private String message;
        private String messageType;
        private boolean isRead;
        private LocalDateTime createdAt;
    }
}
