package com.northwollo.tourism.dto.response;

import com.northwollo.tourism.entity.HotelRating;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HotelRatingResponseDto {

    private Long id;
    private int rating;
    private String comment;
    private String username;
    private String fullName;

    public static HotelRatingResponseDto fromEntity(HotelRating rating) {
        HotelRatingResponseDto dto = new HotelRatingResponseDto();
        dto.setId(rating.getId());
        dto.setRating(rating.getRating());
        dto.setComment(rating.getComment());  // ✅ Fixed: getComment() not getFeedback()
        dto.setUsername(rating.getUser().getUsername());
        dto.setFullName(rating.getUser().getFullName());
        return dto;
    }
}
