package com.northwollo.tourism.dto.response;

import com.northwollo.tourism.entity.TourismRating;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TourismRatingResponseDto {

    private Long id;
    private int rating;
    private String comment;
    private String userFullName;
    private LocalDateTime createdAt;

    public static TourismRatingResponseDto fromEntity(TourismRating rating) {
        TourismRatingResponseDto dto = new TourismRatingResponseDto();
        dto.setId(rating.getId());
        dto.setRating(rating.getRating());
        dto.setComment(rating.getComment());
        dto.setCreatedAt(rating.getCreatedAt());

        if (rating.getUser() != null) {
            dto.setUserFullName(rating.getUser().getFullName());
        }

        return dto;
    }
}
