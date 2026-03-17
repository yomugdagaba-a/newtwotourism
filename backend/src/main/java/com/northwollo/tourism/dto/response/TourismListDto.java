package com.northwollo.tourism.dto.response;

import lombok.Data;

@Data
public class TourismListDto {
    private Long id;
    private String name;
    private String imageUrl;
    private int viewersCount;
}
