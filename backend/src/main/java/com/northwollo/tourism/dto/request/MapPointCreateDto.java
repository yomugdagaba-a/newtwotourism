package com.northwollo.tourism.dto.request;

import com.northwollo.tourism.enums.MapPointType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MapPointCreateDto {

    @NotBlank
    private String name;

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    @NotNull
    private MapPointType type;

    private String description;

    private Long tourismPlaceId;
    private Long hotelId;
    private Long roadInfoId;

    private boolean active = true;
}
