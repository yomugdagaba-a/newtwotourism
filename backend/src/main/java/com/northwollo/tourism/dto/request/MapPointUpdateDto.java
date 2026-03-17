package com.northwollo.tourism.dto.request;

import com.northwollo.tourism.enums.MapPointType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MapPointUpdateDto {

    private String name;
    private Double latitude;
    private Double longitude;
    private MapPointType type;
    private String description;
    private Boolean active;
}
