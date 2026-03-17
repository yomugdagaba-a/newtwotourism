package com.northwollo.tourism.controller;

import com.northwollo.tourism.dto.request.HotelRatingRequestDto;
import com.northwollo.tourism.dto.request.TourismRatingRequestDto;
import com.northwollo.tourism.dto.response.HotelRatingResponseDto;
import com.northwollo.tourism.dto.response.TourismRatingResponseDto;
import com.northwollo.tourism.service.HotelRatingService;
import com.northwollo.tourism.service.TourismRatingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
public class RatingController {

    private final TourismRatingService tourismRatingService;
    private final HotelRatingService hotelRatingService;

    @PostMapping("/tourism")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> addTourismRating(@Valid @RequestBody TourismRatingRequestDto dto) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        tourismRatingService.addRating(dto, currentUsername);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/tourism/{tourismId}")
    public ResponseEntity<List<TourismRatingResponseDto>> getTourismRatings(@PathVariable Long tourismId) {
        List<TourismRatingResponseDto> ratings = tourismRatingService.getRatingsByTourism(tourismId)
                .stream()
                .map(TourismRatingResponseDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ratings);
    }

    // =========================
    // HOTEL RATINGS
    // =========================

    @PostMapping("/hotel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> addHotelRating(@Valid @RequestBody HotelRatingRequestDto dto) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        hotelRatingService.addRating(dto, currentUsername);  // Apply same pattern for Hotel
        return ResponseEntity.ok().build();
    }

    @GetMapping("/hotel/{hotelId}")
    public ResponseEntity<List<HotelRatingResponseDto>> getHotelRatings(@PathVariable Long hotelId) {
        List<HotelRatingResponseDto> ratings = hotelRatingService.getRatingsByHotel(hotelId)
                .stream()
                .map(HotelRatingResponseDto::fromEntity)
                .toList();
        return ResponseEntity.ok(ratings);
    }
}
