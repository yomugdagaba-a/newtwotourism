package com.northwollo.tourism.controller;

import com.northwollo.tourism.dto.request.TourismCreateDto;
import com.northwollo.tourism.dto.request.TourismImageCreateDto;
import com.northwollo.tourism.dto.request.TourismUpdateDto;
import com.northwollo.tourism.dto.response.TourismAdminDto;
import com.northwollo.tourism.dto.response.TourismImageDto;
import com.northwollo.tourism.dto.response.TourismListItemDto;
import com.northwollo.tourism.service.TourismService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/tourism")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminTourismController {

    private final TourismService tourismService;

    // ==============================
    // List all tourism places (for dropdowns - simple)
    // ==============================
    @GetMapping("/list")
    public ResponseEntity<List<TourismListItemDto>> getAllTourismPlaces() {
        return ResponseEntity.ok(tourismService.getAllTourismPlaces());
    }

    // ==============================
    // List all tourism places (for admin page - full details)
    // ==============================
    @GetMapping("/all")
    public ResponseEntity<List<TourismAdminDto>> getAllTourismPlacesForAdmin() {
        return ResponseEntity.ok(tourismService.getAllTourismPlacesForAdmin());
    }

    @PostMapping
    public ResponseEntity<Long> create(@Valid @RequestBody TourismCreateDto dto) {
        return ResponseEntity.ok(tourismService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(
            @PathVariable Long id,
            @Valid @RequestBody TourismUpdateDto dto) {
        tourismService.update(id, dto);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        tourismService.delete(id);
        return ResponseEntity.ok().build();
    }

    // ==============================
    // Image Management Endpoints
    // ==============================

    @GetMapping("/{tourismId}/images")
    public ResponseEntity<List<TourismImageDto>> getImages(@PathVariable Long tourismId) {
        return ResponseEntity.ok(tourismService.getImages(tourismId));
    }

    @PostMapping("/{tourismId}/images")
    public ResponseEntity<TourismImageDto> addImage(
            @PathVariable Long tourismId,
            @Valid @RequestBody TourismImageCreateDto dto) {
        return ResponseEntity.ok(tourismService.addImage(tourismId, dto));
    }

    @PutMapping("/{tourismId}/images/{imageId}")
    public ResponseEntity<TourismImageDto> updateImage(
            @PathVariable Long tourismId,
            @PathVariable Long imageId,
            @Valid @RequestBody TourismImageCreateDto dto) {
        return ResponseEntity.ok(tourismService.updateImage(tourismId, imageId, dto));
    }

    @DeleteMapping("/{tourismId}/images/{imageId}")
    public ResponseEntity<Map<String, String>> deleteImage(
            @PathVariable Long tourismId,
            @PathVariable Long imageId) {
        tourismService.deleteImage(tourismId, imageId);
        return ResponseEntity.ok(Map.of("message", "Image deleted successfully"));
    }

    @PutMapping("/{tourismId}/images/{imageId}/set-main")
    public ResponseEntity<Map<String, String>> setMainImage(
            @PathVariable Long tourismId,
            @PathVariable Long imageId) {
        tourismService.setMainImage(tourismId, imageId);
        return ResponseEntity.ok(Map.of("message", "Main image set successfully"));
    }

    @PutMapping("/{tourismId}/images/reorder")
    public ResponseEntity<Map<String, String>> reorderImages(
            @PathVariable Long tourismId,
            @RequestBody List<Long> imageIds) {
        tourismService.reorderImages(tourismId, imageIds);
        return ResponseEntity.ok(Map.of("message", "Images reordered successfully"));
    }
}
