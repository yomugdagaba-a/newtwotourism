package com.northwollo.tourism.controller;

import com.northwollo.tourism.dto.request.MapPointCreateDto;
import com.northwollo.tourism.dto.request.MapPointUpdateDto;
import com.northwollo.tourism.service.MapPointService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/map-points")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminMapPointController {

    private final MapPointService mapPointService;

    @PostMapping
    public ResponseEntity<Long> create(@Valid @RequestBody MapPointCreateDto dto) {
        return ResponseEntity.ok(mapPointService.createMapPoint(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable Long id, @Valid @RequestBody MapPointUpdateDto dto) {
        mapPointService.updateMapPoint(id, dto);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        mapPointService.deleteMapPoint(id);
        return ResponseEntity.ok().build();
    }
}
