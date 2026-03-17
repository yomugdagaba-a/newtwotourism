package com.northwollo.tourism.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "booking_statuses") // table for statuses
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingStatusEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;
}
