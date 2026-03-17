package com.northwollo.tourism.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class HotelCreateDto {

    @NotNull(message = "Tourism place ID is required")
    private Long tourismPlaceId;

    @NotBlank(message = "Hotel name is required")
    private String name;

    @Min(value = 1, message = "Star rating must be at least 1")
    @Max(value = 5, message = "Star rating cannot exceed 5")
    private int starRating;

    @NotBlank(message = "Contact info is required")
    private String contactInfo;

    private String policies;     // ✅ Optional TEXT

    private String description;  // ✅ Optional TEXT

    // ✅ NEW: Image support for creation
    private List<String> images = new ArrayList<>();  // Gallery images

    private String mainImageUrl;  // Main display image (optional)
}
