package com.northwollo.tourism.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class HorseServiceCreateDto {

    @NotNull
    private Long roadInfoId;

    @NotBlank
    private String ownerName;

    @NotBlank
    private String contactInfo;

    @NotBlank
    private String initialPlace;

    @Positive
    private double cost;
}
