package com.northwollo.tourism.dto.request;

import com.northwollo.tourism.enums.RoadType;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RoadInfoUpdateDto {

    // ✅ NEW: Initial place field (OPTIONAL for updates)
    private String initialPlace;

    private RoadType roadType;
    private String description;
    private Double distanceByCar;
    private Double distanceByFoot;
    private Double distanceByPlane;
    private Double distanceByHorse;
    private Double totalDistance;
}
