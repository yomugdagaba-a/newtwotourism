package com.northwollo.tourism.dto.response;

import com.northwollo.tourism.entity.TourismPlace;
import lombok.Data;

@Data
public class NearbyTourismDto {
    private Long id;
    private String name;
    private String imageUrl;

    public static NearbyTourismDto fromEntity(TourismPlace place) {
        NearbyTourismDto dto = new NearbyTourismDto();
        dto.setId(place.getId());
        dto.setName(place.getName());
        // ✅ Use first image if available
        dto.setImageUrl(
                place.getImages() != null && !place.getImages().isEmpty() ?
                        place.getImages().get(0).getImageUrl() : null
        );
        return dto;
    }
}
