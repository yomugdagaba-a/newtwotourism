package com.northwollo.tourism.repository;

import com.northwollo.tourism.entity.RoadInfo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoadInfoRepository extends JpaRepository<RoadInfo, Long> {
    List<RoadInfo> findByTourismPlaceId(Long tourismPlaceId);
}
