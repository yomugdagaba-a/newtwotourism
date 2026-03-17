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
public class HomepageTourismCardDto {

    private Long id;
    private String name;
    private String imageUrl;
    private int viewersCount;

    public static HomepageTourismCardDto fromEntity(TourismPlace place) {
        String imageUrl = null;
        if (place.getImages() != null && !place.getImages().isEmpty()) {
            imageUrl = place.getImages().get(0).getImageUrl();
        }
        return new HomepageTourismCardDto(
                place.getId(),
                place.getName(),
                imageUrl,
                place.getViewersCount()
        );
    }
}
