package com.northwollo.tourism.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.FutureOrPresent;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "hotel_bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HotelBooking extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "hotel_id")
    private Hotel hotel;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_ref")
    private User user;

    @FutureOrPresent
    @Column(name = "check_in_date", nullable = false)
    private LocalDate checkIn;

    @Future
    @Column(name = "check_out_date", nullable = false)
    private LocalDate checkOut;

    @Column(name = "number_of_guests", nullable = false)
    private Integer numberOfGuests;

    // Additional booking details
    @Column(name = "number_of_rooms")
    private Integer numberOfRooms;

    @Column(name = "special_requests", columnDefinition = "TEXT")
    private String specialRequests;

    // Client contact info
    @Column(name = "client_phone")
    private String clientPhone;

    @Column(name = "client_email")
    private String clientEmail;

    @Column(name = "total_cost", precision = 10, scale = 2)
    private BigDecimal totalCost;

    @Column(name = "receipt_image_url", length = 500)
    private String receiptImageUrl;

    // Rejection reason if rejected
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    // Problem report to admin
    @Column(name = "problem_report", columnDefinition = "TEXT")
    private String problemReport;

    @Column(name = "problem_reported")
    private Boolean problemReported = false;

    @ManyToOne(optional = false)
    @JoinColumn(name = "status_id", nullable = false)
    private BookingStatusEntity status;

    // Messages/conversations for this booking
    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BookingMessage> messages = new ArrayList<>();

    /* ================= BUSINESS RULE HELPERS ================= */

    public boolean canProposeCost() {
        // Allow proposing cost when:
        // - REQUESTED: initial request from client
        // - OWNER_ACCEPTED: owner accepted but hasn't set cost yet
        // - COST_PROPOSED: owner wants to update/change the cost
        String statusName = status.getName();
        return "REQUESTED".equals(statusName) || 
               "OWNER_ACCEPTED".equals(statusName) || 
               "COST_PROPOSED".equals(statusName);
    }

    public boolean canUploadReceipt() {
        return "COST_PROPOSED".equals(status.getName());
    }

    public boolean canApprove() {
        return "PAID".equals(status.getName());
    }

    public boolean isActive() {
        return "APPROVED".equals(status.getName()) && 
               LocalDate.now().isBefore(checkOut.plusDays(1));
    }
}

