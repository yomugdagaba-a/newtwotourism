package com.northwollo.tourism.controller;

import com.northwollo.tourism.dto.response.HotelSummaryDto;
import com.northwollo.tourism.dto.response.TourismImageDto;
import com.northwollo.tourism.service.HotelService;
import com.northwollo.tourism.service.TourismService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tourisms")
@RequiredArgsConstructor
public class TourismController {

    private final HotelService hotelService;
    private final TourismService tourismService;

    @GetMapping("/{id}/hotels")
    public ResponseEntity<List<HotelSummaryDto>> getHotelsByTourism(@PathVariable Long id) {
        List<HotelSummaryDto> hotels = hotelService.getHotels(id);
        return ResponseEntity.ok(hotels);
    }

    // Public endpoint to get tourism images (for detail page gallery)
    @GetMapping("/{id}/images")
    public ResponseEntity<List<TourismImageDto>> getTourismImages(@PathVariable Long id) {
        List<TourismImageDto> images = tourismService.getImages(id);
        return ResponseEntity.ok(images);
    }
}
