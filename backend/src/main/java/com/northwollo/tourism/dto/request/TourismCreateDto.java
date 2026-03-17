package com.northwollo.tourism.dto.request;

import com.northwollo.tourism.enums.TourismCategory;
import lombok.Data;

import java.util.List;

@Data
public class TourismCreateDto {
    private String name;
    private TourismCategory category;
    private String description;
    private String wereda;
    private String kebele;
    private String bestTime;
    private String peaceInfo;
    private List<String> languages; // list of languages
    private String imageUrl; // main image URL
    private List<String> images; // internal/detail images URLs
    private String visitTime; // ISO-8601 duration
}
