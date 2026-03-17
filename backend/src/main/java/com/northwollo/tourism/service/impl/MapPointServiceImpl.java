package com.northwollo.tourism.service.impl;

import com.northwollo.tourism.dto.request.MapPointCreateDto;
import com.northwollo.tourism.dto.request.MapPointUpdateDto;
import com.northwollo.tourism.dto.response.MapPointDto;
import com.northwollo.tourism.entity.*;
import com.northwollo.tourism.exception.ResourceNotFoundException;
import com.northwollo.tourism.repository.*;
import com.northwollo.tourism.service.MapPointService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.northwollo.tourism.enums.MapPointType;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MapPointServiceImpl implements MapPointService {

    private final MapPointRepository mapPointRepository;
    private final TourismPlaceRepository tourismPlaceRepository;
    private final HotelRepository hotelRepository;
    private final RoadInfoRepository roadInfoRepository;

    @Override
    public Long createMapPoint(MapPointCreateDto dto) {
        MapPoint point = new MapPoint();
        point.setName(dto.getName());
        point.setLatitude(dto.getLatitude());
        point.setLongitude(dto.getLongitude());
        point.setType(dto.getType());
        point.setDescription(dto.getDescription());
        point.setActive(dto.isActive());

        if (dto.getTourismPlaceId() != null)
            point.setTourismPlace(tourismPlaceRepository.findById(dto.getTourismPlaceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Tourism place not found")));
        if (dto.getHotelId() != null)
            point.setHotel(hotelRepository.findById(dto.getHotelId())
                    .orElseThrow(() -> new ResourceNotFoundException("Hotel not found")));
        if (dto.getRoadInfoId() != null)
            point.setRoadInfo(roadInfoRepository.findById(dto.getRoadInfoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Road not found")));

        mapPointRepository.save(point);
        return point.getId();
    }

    @Override
    public void updateMapPoint(Long id, MapPointUpdateDto dto) {
        MapPoint point = mapPointRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Map point not found: " + id));

        if (dto.getName() != null) point.setName(dto.getName());
        if (dto.getLatitude() != null) point.setLatitude(dto.getLatitude());
        if (dto.getLongitude() != null) point.setLongitude(dto.getLongitude());
        if (dto.getType() != null) point.setType(dto.getType());
        if (dto.getDescription() != null) point.setDescription(dto.getDescription());
        if (dto.getActive() != null) point.setActive(dto.getActive());

        mapPointRepository.save(point);
    }

    @Override
    public void deleteMapPoint(Long id) {
        if (!mapPointRepository.existsById(id))
            throw new ResourceNotFoundException("Map point not found: " + id);
        mapPointRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public MapPointDto getMapPoint(Long id) {
        MapPoint point = mapPointRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Map point not found: " + id));
        return mapPointToDto(point);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MapPointDto> getActiveMapPointsByTourismPlace(Long tourismPlaceId) {
        return mapPointRepository.findByTourismPlaceIdAndActiveTrue(tourismPlaceId)
                .stream()
                .map(this::mapPointToDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MapPointDto> getActiveMapPointsByType(String type) {
        return mapPointRepository.findByTypeAndActiveTrue(MapPointType.valueOf(type.toUpperCase()))
                .stream()
                .map(this::mapPointToDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MapPointDto> getActiveMapPointsByRoad(Long roadInfoId) {
        return mapPointRepository.findByRoadInfoIdAndActiveTrue(roadInfoId)
                .stream()
                .map(this::mapPointToDto)
                .toList();
    }

    @Override
    public double calculateDistance(Double fromLat, Double fromLng, Double toLat, Double toLng) {
        // Haversine formula to calculate distance in km
        final int R = 6371; // Earth radius in km
        double dLat = Math.toRadians(toLat - fromLat);
        double dLng = Math.toRadians(toLng - fromLng);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(fromLat)) * Math.cos(Math.toRadians(toLat)) *
                        Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private MapPointDto mapPointToDto(MapPoint point) {
        MapPointDto dto = new MapPointDto();
        dto.setId(point.getId());
        dto.setName(point.getName());
        dto.setLatitude(point.getLatitude());
        dto.setLongitude(point.getLongitude());
        dto.setType(point.getType());
        dto.setDescription(point.getDescription());
        dto.setActive(point.isActive());
        dto.setTourismPlaceId(point.getTourismPlace() != null ? point.getTourismPlace().getId() : null);
        dto.setHotelId(point.getHotel() != null ? point.getHotel().getId() : null);
        dto.setRoadInfoId(point.getRoadInfo() != null ? point.getRoadInfo().getId() : null);
        return dto;
    }
}
