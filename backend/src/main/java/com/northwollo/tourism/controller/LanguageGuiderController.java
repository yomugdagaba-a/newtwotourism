package com.northwollo.tourism.controller;

import com.northwollo.tourism.dto.response.LanguageGuiderDto;
import com.northwollo.tourism.service.LanguageGuiderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/guiders")
@RequiredArgsConstructor
public class LanguageGuiderController {

    private final LanguageGuiderService guiderService;

    @GetMapping("/{id}")
    public ResponseEntity<LanguageGuiderDto> getGuider(@PathVariable Long id) {
        return ResponseEntity.ok(guiderService.getGuider(id));
    }

    @GetMapping("/tourism/{tourismPlaceId}")
    public ResponseEntity<List<LanguageGuiderDto>> getActiveGuiders(@PathVariable Long tourismPlaceId) {
        return ResponseEntity.ok(guiderService.getActiveGuidersByTourismPlace(tourismPlaceId));
    }
}
