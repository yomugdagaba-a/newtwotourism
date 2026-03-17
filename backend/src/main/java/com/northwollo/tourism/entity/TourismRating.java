package com.northwollo.tourism.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(
        name = "tourism_ratings",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"tourism_place_id", "user_id"})
        }
)
@Getter
@Setter
public class TourismRating extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "tourism_place_id")
    private TourismPlace tourismPlace;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Min(1)
    @Max(5)
    @Column(nullable = false)
    private int rating;

    @Column(columnDefinition = "TEXT")
    private String comment;
}
