package com.northwollo.tourism.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TourismImageCreateDto {
    @NotBlank(message = "Image URL is required")
    private String imageUrl;

    private String title;
    private String description;
    private boolean isMain = false;
    private int displayOrder = 0;
}
