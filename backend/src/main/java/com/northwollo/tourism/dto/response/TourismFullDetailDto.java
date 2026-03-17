package com.northwollo.tourism.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class TourismFullDetailDto {

    private Long id;
    private String name;
    private String description;
    private String wereda;
    private String kebele;
    private String bestTime;
    private String peaceInfo;
    private String visitTime; // Human-readable format

    // ✅ FIXED: must be List<String>, not String
    private List<String> languages;

    private int viewersCount;

    // ======================
    // Related data
    // ======================
    // Changed from List<String> to List<TourismImageDto> to include title/description
    private List<TourismImageDto> images;
    private List<NearbyTourismDto> nearbyPlaces;

    // Ratings
    private RatingSummaryResponseDto ratingSummary;
    private List<TourismRatingResponseDto> ratings;
}
