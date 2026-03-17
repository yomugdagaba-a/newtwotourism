package com.northwollo.tourism.dto.response;

import com.northwollo.tourism.entity.TourismImage;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TourismImageDto {
    private Long id;
    private String imageUrl;
    private String title;
    private String description;
    private boolean isMain;
    private int displayOrder;

    public static TourismImageDto fromEntity(TourismImage image) {
        TourismImageDto dto = new TourismImageDto();
        dto.setId(image.getId());
        dto.setImageUrl(image.getImageUrl());
        dto.setTitle(image.getTitle());
        dto.setDescription(image.getDescription());
        dto.setMain(image.isMain());
        dto.setDisplayOrder(image.getDisplayOrder());
        return dto;
    }
}
