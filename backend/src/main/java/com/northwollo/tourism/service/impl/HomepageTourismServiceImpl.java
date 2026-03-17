package com.northwollo.tourism.service.impl;

import com.northwollo.tourism.dto.request.HomepageTourismRequestDto;
import com.northwollo.tourism.dto.response.HomepageTourismCardDto;
import com.northwollo.tourism.entity.TourismPlace;
import com.northwollo.tourism.enums.PlaceStatus;
import com.northwollo.tourism.repository.HomepageTourismRepository;
import com.northwollo.tourism.service.HomepageTourismService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HomepageTourismServiceImpl implements HomepageTourismService {

    private final HomepageTourismRepository repository;

    @Override
    public List<HomepageTourismCardDto> getByCategories(HomepageTourismRequestDto request) {
        List<TourismPlace> places = repository.findActiveByCategories(
                PlaceStatus.ACTIVE,
                request.getCategories().stream().toList()
        );

        return places.stream()
                .map(HomepageTourismCardDto::fromEntity)  // ✅ Already uses updated DTO with ID
                .toList();
    }
}
