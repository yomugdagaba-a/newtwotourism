package com.northwollo.tourism.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RatingSummaryResponseDto {

    private Double averageRating;
    private Long totalRatings;
}
