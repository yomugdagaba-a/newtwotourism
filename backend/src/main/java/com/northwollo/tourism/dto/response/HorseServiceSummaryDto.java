package com.northwollo.tourism.dto.response;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HorseServiceSummaryDto {
    private Long id;
    private String ownerName;
    private String contactInfo;
    private String initialPlace;
    private Double cost;
}
