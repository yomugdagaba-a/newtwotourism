package com.northwollo.tourism.service.impl;

import com.northwollo.tourism.dto.request.RoadInfoCreateDto;
import com.northwollo.tourism.dto.request.RoadInfoUpdateDto;
import com.northwollo.tourism.dto.response.RoadInfoDto;
import com.northwollo.tourism.entity.RoadInfo;
import com.northwollo.tourism.entity.TourismPlace;
import com.northwollo.tourism.exception.ResourceNotFoundException;
import com.northwollo.tourism.repository.RoadInfoRepository;
import com.northwollo.tourism.repository.TourismPlaceRepository;
import com.northwollo.tourism.service.RoadService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoadServiceImpl implements RoadService {

    private final RoadInfoRepository roadRepository;
    private final TourismPlaceRepository tourismRepository;

    @Override
    @Transactional(readOnly = true)
    public List<RoadInfoDto> getRoadsByTourismPlace(Long tourismPlaceId) {
        return roadRepository.findByTourismPlaceId(tourismPlaceId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public RoadInfoDto getRoadById(Long roadId) {
        RoadInfo road = roadRepository.findById(roadId)
                .orElseThrow(() -> new ResourceNotFoundException("Road info not found: " + roadId));
        return mapToDto(road);
    }

    @Override
    @Transactional
    public Long createRoad(RoadInfoCreateDto dto) {
        TourismPlace place = tourismRepository.findById(dto.getTourismPlaceId())
                .orElseThrow(() -> new ResourceNotFoundException("Tourism place not found: " + dto.getTourismPlaceId()));

        RoadInfo road = new RoadInfo();
        road.setTourismPlace(place);
        road.setInitialPlace(dto.getInitialPlace());  // ✅ NEW MAPPING
        road.setRoadType(dto.getRoadType() != null ? dto.getRoadType() : com.northwollo.tourism.enums.RoadType.CAR);
        road.setDescription(dto.getDescription());
        road.setDistanceByCar(dto.getDistanceByCar());
        road.setDistanceByFoot(dto.getDistanceByFoot());
        road.setDistanceByPlane(dto.getDistanceByPlane());
        road.setDistanceByHorse(dto.getDistanceByHorse());
        road.setTotalDistance(dto.getTotalDistance());

        roadRepository.save(road);
        return road.getId();
    }

    @Override
    @Transactional
    public void updateRoad(Long roadId, RoadInfoUpdateDto dto) {
        RoadInfo road = roadRepository.findById(roadId)
                .orElseThrow(() -> new ResourceNotFoundException("Road info not found: " + roadId));

        // ✅ NEW: Update initialPlace
        if (dto.getInitialPlace() != null && !dto.getInitialPlace().trim().isEmpty()) {
            road.setInitialPlace(dto.getInitialPlace());
        }

        if (dto.getRoadType() != null) road.setRoadType(dto.getRoadType());
        if (dto.getDescription() != null) road.setDescription(dto.getDescription());
        if (dto.getDistanceByCar() != null) road.setDistanceByCar(dto.getDistanceByCar());
        if (dto.getDistanceByFoot() != null) road.setDistanceByFoot(dto.getDistanceByFoot());
        if (dto.getDistanceByPlane() != null) road.setDistanceByPlane(dto.getDistanceByPlane());
        if (dto.getDistanceByHorse() != null) road.setDistanceByHorse(dto.getDistanceByHorse());
        if (dto.getTotalDistance() != null) road.setTotalDistance(dto.getTotalDistance());

        roadRepository.save(road);
    }

    @Override
    @Transactional
    public void deleteRoad(Long roadId) {
        if (!roadRepository.existsById(roadId)) {
            throw new ResourceNotFoundException("Road info not found: " + roadId);
        }
        roadRepository.deleteById(roadId);
    }

    private RoadInfoDto mapToDto(RoadInfo road) {
        RoadInfoDto dto = RoadInfoDto.fromEntity(road);  // ✅ Use static method from DTO
        return dto;
    }
}
