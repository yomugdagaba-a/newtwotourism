package com.northwollo.tourism.service;

import com.northwollo.tourism.dto.request.HomepageTourismRequestDto;
import com.northwollo.tourism.dto.response.HomepageTourismCardDto;

import java.util.List;

public interface HomepageTourismService {
    List<HomepageTourismCardDto> getByCategories(HomepageTourismRequestDto request);
}
