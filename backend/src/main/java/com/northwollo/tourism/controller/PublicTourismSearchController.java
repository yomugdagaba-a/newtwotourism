package com.northwollo.tourism.controller;

import com.northwollo.tourism.publicsearch.dto.PublicTourismSearchRequestDto;
import com.northwollo.tourism.dto.response.PublicTourismSearchResponseDto;
import com.northwollo.tourism.service.PublicTourismSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tourisms/public")
@RequiredArgsConstructor
public class PublicTourismSearchController {

    private final PublicTourismSearchService service;

    @GetMapping("/search")
    public Page<PublicTourismSearchResponseDto> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String kebele,
            @RequestParam(required = false) String wereda,
            @RequestParam(required = false) List<String> categories,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir
    ) {

        PublicTourismSearchRequestDto request = new PublicTourismSearchRequestDto();

        request.setKeyword(keyword);
        request.setKebele(kebele);
        request.setWereda(wereda);
        request.setPage(page);
        request.setSize(size);
        request.setSortBy(sortBy);
        request.setSortDir(sortDir);

        if (categories != null) {
            request.setCategories(
                    categories.stream()
                            .map(c -> Enum.valueOf(
                                    com.northwollo.tourism.enums.TourismCategory.class, c))
                            .collect(java.util.stream.Collectors.toSet())
            );
        }

        return service.search(request);
    }
}
