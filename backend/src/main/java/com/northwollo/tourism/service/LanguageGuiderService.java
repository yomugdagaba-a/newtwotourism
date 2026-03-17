package com.northwollo.tourism.service;

import com.northwollo.tourism.dto.request.LanguageGuiderCreateDto;
import com.northwollo.tourism.dto.request.LanguageGuiderUpdateDto;
import com.northwollo.tourism.dto.response.LanguageGuiderDto;

import java.util.List;

public interface LanguageGuiderService {

    // Admin operations
    Long createGuider(LanguageGuiderCreateDto dto);
    void updateGuider(Long guiderId, LanguageGuiderUpdateDto dto);
    void deleteGuider(Long guiderId);

    // User operations
    LanguageGuiderDto getGuider(Long guiderId);
    List<LanguageGuiderDto> getActiveGuidersByTourismPlace(Long tourismPlaceId);
}
