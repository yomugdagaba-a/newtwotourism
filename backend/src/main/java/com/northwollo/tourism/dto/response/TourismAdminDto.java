package com.northwollo.tourism.dto.response;

import com.northwollo.tourism.entity.TourismImage;
import com.northwollo.tourism.entity.TourismPlace;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Full DTO for admin tourism places listing
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TourismAdminDto {
    private Long id;
    private String name;
    private String description;
    private String wereda;
    private String kebele;
    private List<String> categories = new ArrayList<>();
    private String bestTime;
    private String peaceInfo;
    private String visitTime;
    private List<String> languages = new ArrayList<>();
    private List<String> images = new ArrayList<>();
    private String imageUrl;
    private String status;
    private int viewersCount;
    private LocalDateTime createdAt;

    public static TourismAdminDto fromEntity(TourismPlace place) {
        TourismAdminDto dto = new TourismAdminDto();
        dto.setId(place.getId());
        dto.setName(place.getName());
        dto.setDescription(place.getDescription());
        dto.setWereda(place.getWereda());
        dto.setKebele(place.getKebele());
        
        // Convert single category to array
        if (place.getCategory() != null) {
            dto.setCategories(List.of(place.getCategory().name()));
        } else {
            dto.setCategories(new ArrayList<>());
        }
        
        dto.setBestTime(place.getBestTime());
        dto.setPeaceInfo(place.getPeaceInfo());
        dto.setVisitTime(place.getVisitTime() != null ? place.getVisitTime().toString() : null);
        dto.setLanguages(place.getLanguages() != null ? place.getLanguages() : new ArrayList<>());
        dto.setImageUrl(place.getImageUrl());
        dto.setStatus(place.getStatus() != null ? place.getStatus().name() : "ACTIVE");
        dto.setViewersCount(place.getViewersCount());
        dto.setCreatedAt(place.getCreatedAt());
        
        // Get images from TourismImage entities
        if (place.getImages() != null && !place.getImages().isEmpty()) {
            dto.setImages(place.getImages().stream()
                    .map(TourismImage::getImageUrl)
                    .collect(Collectors.toList()));
        }
        
        return dto;
    }
}
