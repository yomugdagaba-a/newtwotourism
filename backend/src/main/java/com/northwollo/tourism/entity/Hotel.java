package com.northwollo.tourism.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "hotels")
@Getter
@Setter
@NoArgsConstructor
public class Hotel extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tourism_place_id")
    private TourismPlace tourismPlace;

    // Hotel Owner - the user who owns this hotel
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @NotBlank
    private String name;

    @Min(1)
    @Max(5)
    private int starRating;

    @NotBlank
    private String contactInfo;

    @Column(columnDefinition = "TEXT")
    private String policies;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Hotel active status
    @Column(nullable = false)
    private boolean active = true;

    // ✅ Images relationship - bidirectional with HotelImage
    @OneToMany(mappedBy = "hotel", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<HotelImage> images = new ArrayList<>();

    // ✅ Helper methods for images
    public void addImage(HotelImage image) {
        images.add(image);
        image.setHotel(this);
    }

    public void removeImage(HotelImage image) {
        images.remove(image);
        image.setHotel(null);
    }
}
