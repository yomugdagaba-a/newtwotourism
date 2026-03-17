package com.northwollo.tourism.controller;

import com.northwollo.tourism.dto.request.HotelCreateDto;
import com.northwollo.tourism.dto.request.HotelUpdateDto;
import com.northwollo.tourism.dto.response.HotelDetailInfoDto;
import com.northwollo.tourism.service.HotelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/hotels")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminHotelController {

    private final HotelService hotelService;

    // ✅ NEW: Get all hotels for admin
    @GetMapping
    public ResponseEntity<List<HotelDetailInfoDto>> getAllHotels() {
        List<HotelDetailInfoDto> hotels = hotelService.getAllHotelsForAdmin();
        return ResponseEntity.ok(hotels);
    }

    @PostMapping
    public ResponseEntity<Long> create(@Valid @RequestBody HotelCreateDto dto) {
        Long hotelId = hotelService.create(dto);
        return ResponseEntity.ok(hotelId);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable Long id,
                                       @Valid @RequestBody HotelUpdateDto dto) {
        hotelService.update(id, dto);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        hotelService.delete(id);
        return ResponseEntity.ok().build();
    }

    // ✅ NEW: Add images to existing hotel
    @PostMapping("/{hotelId}/images")
    public ResponseEntity<Map<String, String>> addHotelImages(
            @PathVariable Long hotelId,
            @RequestBody Map<String, Object> imageData) {

        @SuppressWarnings("unchecked")
        List<String> images = (List<String>) imageData.get("images");
        String setMainImage = (String) imageData.get("setMainImage");

        hotelService.addHotelImages(hotelId, images, setMainImage);

        Map<String, String> response = Map.of("message", "Images added successfully");
        return ResponseEntity.ok(response);
    }

    // ✅ NEW: Delete specific hotel image
    @DeleteMapping("/{hotelId}/images/{imageId}")
    public ResponseEntity<Map<String, String>> deleteHotelImage(
            @PathVariable Long hotelId,
            @PathVariable Long imageId) {

        hotelService.deleteHotelImage(hotelId, imageId);

        Map<String, String> response = Map.of("message", "Image deleted successfully");
        return ResponseEntity.ok(response);
    }
}
