package com.northwollo.tourism.dto.response;

import com.northwollo.tourism.enums.MapPointType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MapPointDto {

    private Long id;
    private String name;
    private Double latitude;
    private Double longitude;
    private MapPointType type;
    private String description;
    private boolean active;
    private Long tourismPlaceId;
    private Long hotelId;
    private Long roadInfoId;
}
