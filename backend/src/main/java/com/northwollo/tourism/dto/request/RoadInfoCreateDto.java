package com.northwollo.tourism.dto.request;

import com.northwollo.tourism.enums.RoadType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RoadInfoCreateDto {

    @NotNull(message = "Tourism place ID is required")
    private Long tourismPlaceId;

    // ✅ NEW: Initial place field (REQUIRED)
    @NotNull(message = "Initial place is required")
    @NotBlank(message = "Initial place cannot be blank")
    private String initialPlace;

    // Road type - defaults to CAR if not provided
    private RoadType roadType = RoadType.CAR;

    private String description;

    @Positive(message = "Distance by car must be positive")
    private Double distanceByCar;

    @Positive(message = "Distance by foot must be positive")
    private Double distanceByFoot;

    @Positive(message = "Distance by plane must be positive")
    private Double distanceByPlane;

    @Positive(message = "Distance by horse must be positive")
    private Double distanceByHorse;

    @Positive(message = "Total distance must be positive")
    private Double totalDistance;
}
