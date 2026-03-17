package com.northwollo.tourism.dto.response;

import com.northwollo.tourism.entity.TourismPlace;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PublicTourismSearchResponseDto {

    private Long id;
    private String name;
    private String imageUrl;
    private long viewersCount;
    private String category;
    private String wereda;
    private String kebele;
    private String description;

    public static PublicTourismSearchResponseDto fromEntity(TourismPlace place) {
        String imageUrl = null;
        if (place.getImages() != null && !place.getImages().isEmpty()) {
            imageUrl = place.getImages().get(0).getImageUrl();
        }
        return new PublicTourismSearchResponseDto(
                place.getId(),
                place.getName(),
                imageUrl,
                place.getViewersCount(),
                place.getCategory() != null ? place.getCategory().name() : null,
                place.getWereda(),
                place.getKebele(),
                place.getDescription()
        );
    }
}
