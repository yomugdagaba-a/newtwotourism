package com.northwollo.tourism.controller;

import com.northwollo.tourism.dto.request.HorseServiceCreateDto;
import com.northwollo.tourism.dto.request.HorseServiceUpdateDto;
import com.northwollo.tourism.dto.response.HorseServiceSummaryDto;
import com.northwollo.tourism.service.HorseServiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class HorseServiceController {

    private final HorseServiceService horseServiceService;

    // ✅ ADMIN ENDPOINTS (KEEP EXISTING)
    @PostMapping("/api/admin/horse-services")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Long> create(@Valid @RequestBody HorseServiceCreateDto dto) {
        return ResponseEntity.ok(horseServiceService.create(dto));
    }

    @PutMapping("/api/admin/horse-services/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> update(
            @PathVariable Long id,
            @Valid @RequestBody HorseServiceUpdateDto dto) {
        horseServiceService.update(id, dto);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/api/admin/horse-services/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        horseServiceService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ✅ PUBLIC ENDPOINTS (NEW - FIXES YOUR ERROR!)
    @GetMapping("/api/roads/{roadId}/horse-services")
    public ResponseEntity<List<HorseServiceSummaryDto>> getByRoad(@PathVariable Long roadId) {
        return ResponseEntity.ok(horseServiceService.getByRoadId(roadId));
    }

    @GetMapping("/api/horse-services/{id}")
    public ResponseEntity<HorseServiceSummaryDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(horseServiceService.getById(id));
    }
}
