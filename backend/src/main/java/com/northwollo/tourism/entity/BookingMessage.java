package com.northwollo.tourism.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "booking_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingMessage extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "booking_id")
    private HotelBooking booking;

    @ManyToOne(optional = false)
    @JoinColumn(name = "sender_id")
    private User sender;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MessageType messageType;

    // Whether the message has been read
    @Column(nullable = false)
    private boolean isRead = false;

    public enum MessageType {
        BOOKING_REQUEST,      // Client sends booking request
        COST_PROPOSAL,        // Hotel owner proposes cost
        COST_ACCEPTED,        // Client accepts cost
        RECEIPT_UPLOADED,     // Client uploads receipt
        BOOKING_APPROVED,     // Hotel owner approves booking
        BOOKING_REJECTED,     // Hotel owner rejects booking
        PROBLEM_REPORT,       // Client reports problem to admin
        ADMIN_MESSAGE,        // Admin sends message
        GENERAL               // General conversation
    }
}
