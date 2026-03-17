package com.northwollo.tourism.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HorseServiceUpdateDto {

    @NotBlank
    private String ownerName;

    @NotBlank
    private String contactInfo;

    @NotBlank
    private String initialPlace;

    @NotNull
    private Double cost;

    @NotNull
    private Long roadInfoId;
}
