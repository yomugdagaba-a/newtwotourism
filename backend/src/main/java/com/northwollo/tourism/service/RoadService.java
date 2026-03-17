package com.northwollo.tourism.service;

import com.northwollo.tourism.dto.request.RoadInfoCreateDto;
import com.northwollo.tourism.dto.request.RoadInfoUpdateDto;
import com.northwollo.tourism.dto.response.RoadInfoDto;

import java.util.List;

public interface RoadService {
    List<RoadInfoDto> getRoadsByTourismPlace(Long tourismPlaceId);
    RoadInfoDto getRoadById(Long roadId);
    Long createRoad(RoadInfoCreateDto dto);
    void updateRoad(Long roadId, RoadInfoUpdateDto dto);
    void deleteRoad(Long roadId);
}
