package com.northwollo.tourism.controller;

import com.northwollo.tourism.dto.response.TourismFullDetailDto;
import com.northwollo.tourism.dto.response.TourismPublicCardDto;
import com.northwollo.tourism.enums.TourismCategory;
import com.northwollo.tourism.service.TourismService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/tourisms")
@RequiredArgsConstructor
public class PublicTourismController {

    private final TourismService tourismService;


    /**
     * ✅ Detail page endpoint
     * GET /api/tourisms/123 → TourismFullDetailDto
     */
    @GetMapping("/{id}")
    public ResponseEntity<TourismFullDetailDto> getDetail(@PathVariable Long id) {
        log.info("Fetching tourism detail for ID: {}", id);

        try {
            TourismFullDetailDto detail = tourismService.getFullDetail(id);
            log.info("Successfully returned detail for tourism ID: {}", id);
            return ResponseEntity.ok(detail);
        } catch (Exception e) {
            log.error("Error fetching tourism detail for ID: {}", id, e);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * ✅ Health check endpoint
     * GET /api/tourisms/health
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("North Wollo Tourism API ✅");
    }
}
