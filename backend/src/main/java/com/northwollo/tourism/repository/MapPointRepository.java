package com.northwollo.tourism.repository;

import com.northwollo.tourism.entity.MapPoint;
import com.northwollo.tourism.enums.MapPointType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MapPointRepository extends JpaRepository<MapPoint, Long> {

    List<MapPoint> findByTourismPlaceIdAndActiveTrue(Long tourismPlaceId);
    
    List<MapPoint> findByTourismPlaceId(Long tourismPlaceId);

    List<MapPoint> findByTypeAndActiveTrue(MapPointType type);

    List<MapPoint> findByRoadInfoIdAndActiveTrue(Long roadInfoId);
}
