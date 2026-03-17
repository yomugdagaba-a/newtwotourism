package com.northwollo.tourism.service;

import com.northwollo.tourism.dto.request.MapPointCreateDto;
import com.northwollo.tourism.dto.request.MapPointUpdateDto;
import com.northwollo.tourism.dto.response.MapPointDto;

import java.util.List;

public interface MapPointService {

    // Admin CRUD
    Long createMapPoint(MapPointCreateDto dto);
    void updateMapPoint(Long id, MapPointUpdateDto dto);
    void deleteMapPoint(Long id);

    // User operations
    MapPointDto getMapPoint(Long id);
    List<MapPointDto> getActiveMapPointsByTourismPlace(Long tourismPlaceId);
    List<MapPointDto> getActiveMapPointsByType(String type);
    List<MapPointDto> getActiveMapPointsByRoad(Long roadInfoId);

    // Distance calculation
    double calculateDistance(Double fromLat, Double fromLng, Double toLat, Double toLng);
}
