package com.northwollo.tourism.service.impl;

import com.northwollo.tourism.dto.request.HorseServiceCreateDto;
import com.northwollo.tourism.dto.request.HorseServiceUpdateDto;
import com.northwollo.tourism.dto.response.HorseServiceSummaryDto;
import com.northwollo.tourism.entity.HorseService;
import com.northwollo.tourism.entity.RoadInfo;
import com.northwollo.tourism.exception.ResourceNotFoundException;
import com.northwollo.tourism.repository.HorseServiceRepository;
import com.northwollo.tourism.repository.RoadInfoRepository;
import com.northwollo.tourism.service.HorseServiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class HorseServiceServiceImpl implements HorseServiceService {

    private final HorseServiceRepository horseServiceRepository;
    private final RoadInfoRepository roadInfoRepository;

    @Override
    public Long create(HorseServiceCreateDto dto) {
        RoadInfo road = roadInfoRepository.findById(dto.getRoadInfoId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "RoadInfo not found with id: " + dto.getRoadInfoId()));

        // Allow multiple horse services per road (one road can have many horse owners)
        HorseService horse = new HorseService();
        horse.setRoadInfo(road);
        horse.setOwnerName(dto.getOwnerName());
        horse.setContactInfo(dto.getContactInfo());
        horse.setInitialPlace(dto.getInitialPlace());
        horse.setCost(dto.getCost());

        horseServiceRepository.save(horse);
        return horse.getId();
    }

    @Override
    public void update(Long id, HorseServiceUpdateDto dto) {
        HorseService horse = horseServiceRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Horse service not found with id: " + id));

        RoadInfo road = roadInfoRepository.findById(dto.getRoadInfoId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "RoadInfo not found with id: " + dto.getRoadInfoId()));

        // Allow updating to any road (multiple horse services per road is allowed)
        horse.setOwnerName(dto.getOwnerName());
        horse.setContactInfo(dto.getContactInfo());
        horse.setInitialPlace(dto.getInitialPlace());
        horse.setCost(dto.getCost());
        horse.setRoadInfo(road);

        horseServiceRepository.save(horse);
    }

    @Override
    public void delete(Long id) {
        if (!horseServiceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Horse service not found: " + id);
        }
        horseServiceRepository.deleteById(id);
    }

    // ✅ NEW METHODS FOR PUBLIC CONTROLLER ENDPOINTS
    @Override
    @Transactional(readOnly = true)
    public List<HorseServiceSummaryDto> getByRoadId(Long roadId) {
        return horseServiceRepository.findByRoadInfoId(roadId)
                .stream()
                .map(this::toHorseServiceSummary)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public HorseServiceSummaryDto getById(Long id) {
        HorseService horse = horseServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Horse service not found: " + id));
        return toHorseServiceSummary(horse);
    }

    // ✅ YOUR EXISTING METHODS (RENAMED FOR CONSISTENCY)
    @Override
    @Transactional(readOnly = true)
    public List<HorseServiceSummaryDto> getHorseServicesByTourismPlace(Long tourismPlaceId) {
        return horseServiceRepository.findByTourismPlaceId(tourismPlaceId)
                .stream()
                .map(this::toHorseServiceSummary)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<HorseServiceSummaryDto> getHorseServicesByRoadInfo(Long roadInfoId) {
        return getByRoadId(roadInfoId); // Reuse the new method
    }

    private HorseServiceSummaryDto toHorseServiceSummary(HorseService horse) {
        return new HorseServiceSummaryDto(
                horse.getId(),
                horse.getOwnerName(),
                horse.getContactInfo(),
                horse.getInitialPlace(),
                horse.getCost()
        );
    }
}
