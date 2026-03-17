package com.northwollo.tourism.controller;

import com.northwollo.tourism.dto.request.RoadInfoCreateDto;
import com.northwollo.tourism.dto.request.RoadInfoUpdateDto;
import com.northwollo.tourism.dto.response.RoadInfoDto;
import com.northwollo.tourism.service.RoadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RoadController {

    private final RoadService roadService;

    // ✅ PUBLIC: Get roads by tourism place (for frontend)
    @GetMapping("/tourisms/{tourismPlaceId}/roads")
    public ResponseEntity<List<RoadInfoDto>> getRoadsByTourism(@PathVariable Long tourismPlaceId) {
        return ResponseEntity.ok(roadService.getRoadsByTourismPlace(tourismPlaceId));
    }

    // ✅ PUBLIC: Get road by ID (for frontend road detail page)
    @GetMapping("/roads/{id}")
    public ResponseEntity<RoadInfoDto> getPublicRoadById(@PathVariable Long id) {
        return ResponseEntity.ok(roadService.getRoadById(id));
    }

    // ✅ ADMIN: CRUD Operations
    @PostMapping("/admin/roads")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Long> create(@Valid @RequestBody RoadInfoCreateDto dto) {
        return ResponseEntity.ok(roadService.createRoad(dto));
    }

    @PutMapping("/admin/roads/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> update(@PathVariable Long id, @Valid @RequestBody RoadInfoUpdateDto dto) {
        roadService.updateRoad(id, dto);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/admin/roads/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        roadService.deleteRoad(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/admin/roads/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RoadInfoDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(roadService.getRoadById(id));
    }

    @GetMapping("/admin/roads/tourism/{tourismPlaceId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RoadInfoDto>> getByTourismPlace(@PathVariable Long tourismPlaceId) {
        return ResponseEntity.ok(roadService.getRoadsByTourismPlace(tourismPlaceId));
    }
}
