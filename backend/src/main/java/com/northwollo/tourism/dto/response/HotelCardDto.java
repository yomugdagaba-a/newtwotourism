package com.northwollo.tourism.dto.response;

import com.northwollo.tourism.entity.Hotel;
import lombok.Data;

@Data
public class HotelCardDto {
    private Long id;
    private String name;
    private Integer stars;
    private String imageUrl; // optional, set null if images not available

    public static HotelCardDto fromEntity(Hotel hotel) {
        HotelCardDto dto = new HotelCardDto();
        dto.setId(hotel.getId());
        dto.setName(hotel.getName());
        dto.setStars(hotel.getStarRating());
        // No images in current entity, so leave imageUrl null
        dto.setImageUrl(null);
        return dto;
    }
}
