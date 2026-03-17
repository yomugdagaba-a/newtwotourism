package com.northwollo.tourism.dto.response;

import com.northwollo.tourism.entity.RoadInfo;
import lombok.Data;

@Data
public class RoadInfoDto {

    private Long id;

    // ✅ NEW: Initial place field
    private String initialPlace;

    private String description;
    private String roadType;
    private Double distanceByCar;
    private Double distanceByFoot;
    private Double distanceByPlane;
    private Double distanceByHorse;
    private Double totalDistance;

    public static RoadInfoDto fromEntity(RoadInfo road) {
        RoadInfoDto dto = new RoadInfoDto();
        dto.setId(road.getId());
        dto.setInitialPlace(road.getInitialPlace());  // ✅ NEW
        dto.setDescription(road.getDescription());
        dto.setRoadType(road.getRoadType() != null ? road.getRoadType().name() : null);
        dto.setDistanceByCar(road.getDistanceByCar());
        dto.setDistanceByFoot(road.getDistanceByFoot());
        dto.setDistanceByPlane(road.getDistanceByPlane());
        dto.setDistanceByHorse(road.getDistanceByHorse());
        dto.setTotalDistance(road.getTotalDistance());
        return dto;
    }
}
