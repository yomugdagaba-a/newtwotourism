package com.northwollo.tourism.entity;

import com.northwollo.tourism.enums.PlaceStatus;
import com.northwollo.tourism.enums.TourismCategory;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tourism_places")
public class TourismPlace extends BaseEntity {

    @NotBlank
    @Size(min = 3, max = 150)
    @Column(nullable = false)
    private String name;

    @NotNull
    @Enumerated(EnumType.STRING)
    private TourismCategory category;

    @NotBlank
    @Column(columnDefinition = "TEXT")
    private String description;

    @NotBlank
    private String wereda;

    @NotBlank
    private String kebele;

    private String bestTime;

    @Column(columnDefinition = "TEXT")
    private String peaceInfo;

    private Duration visitTime;

    @ElementCollection
    private List<String> languages = new ArrayList<>();

    @NotNull
    @Enumerated(EnumType.STRING)
    private PlaceStatus status = PlaceStatus.ACTIVE;

    private int viewersCount = 0;

    // Single main image URL
    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    // Relationship with TourismImage
    @OneToMany(mappedBy = "tourismPlace", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TourismImage> images = new ArrayList<>();
}
