package com.northwollo.tourism.controller;

import com.northwollo.tourism.dto.response.TourismFullDetailDto; // ✅ Import added
import com.northwollo.tourism.service.TourismService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user/tourism")
@RequiredArgsConstructor
public class UserTourismController {

    private final TourismService tourismService;

    @GetMapping("/{id}/details")
    public ResponseEntity<?> fullDetail(@PathVariable Long id) {
        return ResponseEntity.ok(
                tourismService.getFullDetail(id)
        );
    }

    @GetMapping("/tourism/{id}/detail")
    @PreAuthorize("isAuthenticated()")
    public TourismFullDetailDto getFullDetail(@PathVariable Long id) {
        return tourismService.getFullDetail(id);
    }


    }




