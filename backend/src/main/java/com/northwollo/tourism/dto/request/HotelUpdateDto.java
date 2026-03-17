package com.northwollo.tourism.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class HotelUpdateDto {

    private String name;  // ✅ Optional for partial updates

    @Min(value = 1, message = "Star rating must be at least 1")
    @Max(value = 5, message = "Star rating cannot exceed 5")
    private Integer starRating;  // ✅ Optional Integer

    private String contactInfo;  // ✅ Optional

    private String policies;     // ✅ Optional TEXT

    private String description;  // ✅ Optional TEXT

    // ✅ NEW: Image support for updates
    private List<String> images;         // Add/update gallery images

    private String mainImageUrl;         // Change main display image
}
