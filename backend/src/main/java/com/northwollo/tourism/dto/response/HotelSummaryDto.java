package com.northwollo.tourism.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HotelSummaryDto {
    private Long id;
    private String name;
    private Integer stars;
    private String imageUrl;
}
