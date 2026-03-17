package com.northwollo.tourism.service;

import com.northwollo.tourism.publicsearch.dto.PublicTourismSearchRequestDto;
import com.northwollo.tourism.dto.response.PublicTourismSearchResponseDto;
import org.springframework.data.domain.Page;

public interface PublicTourismSearchService {

    Page<PublicTourismSearchResponseDto> search(PublicTourismSearchRequestDto request);
}
