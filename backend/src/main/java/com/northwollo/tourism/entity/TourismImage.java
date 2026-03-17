package com.northwollo.tourism.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tourism_images")
public class TourismImage extends BaseEntity {

    @Column(nullable = false)
    private String imageUrl;

    // Title/caption for the image (e.g., "Bete Giorgis", "Bete Maryam")
    private String title;

    // Description of what the image shows
    @Column(columnDefinition = "TEXT")
    private String description;

    // Whether this is the main/cover image
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean isMain = false;

    // Display order for sorting
    @Column(nullable = false, columnDefinition = "int default 0")
    private int displayOrder = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tourism_place_id", nullable = false)
    private TourismPlace tourismPlace;
}
