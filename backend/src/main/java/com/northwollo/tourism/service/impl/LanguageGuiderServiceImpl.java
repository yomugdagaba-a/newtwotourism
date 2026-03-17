package com.northwollo.tourism.service.impl;

import com.northwollo.tourism.dto.request.LanguageGuiderCreateDto;
import com.northwollo.tourism.dto.request.LanguageGuiderUpdateDto;
import com.northwollo.tourism.dto.response.LanguageGuiderDto;
import com.northwollo.tourism.entity.LanguageGuider;
import com.northwollo.tourism.entity.TourismPlace;
import com.northwollo.tourism.exception.ResourceNotFoundException;
import com.northwollo.tourism.repository.LanguageGuiderRepository;
import com.northwollo.tourism.repository.TourismPlaceRepository;
import com.northwollo.tourism.service.LanguageGuiderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class LanguageGuiderServiceImpl implements LanguageGuiderService {

    private final LanguageGuiderRepository guiderRepository;
    private final TourismPlaceRepository tourismRepository;

    @Override
    public Long createGuider(LanguageGuiderCreateDto dto) {
        TourismPlace place = tourismRepository.findById(dto.getTourismPlaceId())
                .orElseThrow(() -> new ResourceNotFoundException("Tourism place not found: " + dto.getTourismPlaceId()));

        LanguageGuider guider = new LanguageGuider();
        guider.setFullName(dto.getFullName());
        guider.setContactInfo(dto.getContactInfo());
        guider.setLanguages(dto.getLanguages());
        guider.setTourismPlace(place);
        guider.setActive(dto.isActive());

        guiderRepository.save(guider);
        return guider.getId();
    }

    @Override
    public void updateGuider(Long guiderId, LanguageGuiderUpdateDto dto) {
        LanguageGuider guider = guiderRepository.findById(guiderId)
                .orElseThrow(() -> new ResourceNotFoundException("Guider not found: " + guiderId));

        if (dto.getFullName() != null) guider.setFullName(dto.getFullName());
        if (dto.getContactInfo() != null) guider.setContactInfo(dto.getContactInfo());
        if (dto.getLanguages() != null) guider.setLanguages(dto.getLanguages());
        if (dto.getActive() != null) guider.setActive(dto.getActive());

        guiderRepository.save(guider);
    }

    @Override
    public void deleteGuider(Long guiderId) {
        if (!guiderRepository.existsById(guiderId)) {
            throw new ResourceNotFoundException("Guider not found: " + guiderId);
        }
        guiderRepository.deleteById(guiderId);
    }

    @Override
    @Transactional(readOnly = true)
    public LanguageGuiderDto getGuider(Long guiderId) {
        LanguageGuider guider = guiderRepository.findById(guiderId)
                .orElseThrow(() -> new ResourceNotFoundException("Guider not found: " + guiderId));
        return mapToDto(guider);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LanguageGuiderDto> getActiveGuidersByTourismPlace(Long tourismPlaceId) {
        return guiderRepository.findByTourismPlaceIdAndActiveTrue(tourismPlaceId)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    private LanguageGuiderDto mapToDto(LanguageGuider guider) {
        LanguageGuiderDto dto = new LanguageGuiderDto();
        dto.setId(guider.getId());
        dto.setFullName(guider.getFullName());
        dto.setContactInfo(guider.getContactInfo());
        dto.setLanguages(guider.getLanguages());
        dto.setActive(guider.isActive());
        dto.setTourismPlaceId(guider.getTourismPlace().getId());
        dto.setTourismPlaceName(guider.getTourismPlace().getName());
        return dto;
    }
}
