package com.northwollo.tourism.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(
        name = "hotel_ratings",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"hotel_id", "user_id"})
        }
)
@Getter
@Setter
public class HotelRating extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "hotel_id")
    private Hotel hotel;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Min(1)
    @Max(5)
    @Column(nullable = false)
    private int rating;

    @Column(columnDefinition = "TEXT")
    private String comment;  // Fixed: match DTO field name
}
