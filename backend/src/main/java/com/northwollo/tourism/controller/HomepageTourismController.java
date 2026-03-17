package com.northwollo.tourism.controller;

import com.northwollo.tourism.dto.request.HomepageTourismRequestDto;
import com.northwollo.tourism.dto.response.HomepageTourismCardDto;
import com.northwollo.tourism.enums.TourismCategory;
import com.northwollo.tourism.service.HomepageTourismService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tourisms/public")
@RequiredArgsConstructor
public class HomepageTourismController {

    private final HomepageTourismService service;

    @GetMapping("/homepage")
    public ResponseEntity<?> getByCategories(
            @RequestParam List<String> categories
    ) {
        try {
            HomepageTourismRequestDto request = new HomepageTourismRequestDto();

            Set<TourismCategory> categoryEnums = categories.stream()
                    .map(c -> TourismCategory.valueOf(c.toUpperCase().trim()))
                    .collect(Collectors.toSet());
            request.setCategories(categoryEnums);

            List<HomepageTourismCardDto> results = service.getByCategories(request);
            return ResponseEntity.ok(results);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Failed to fetch homepage tourism places",
                            "message", e.getMessage()
                    ));
        }
    }
}
