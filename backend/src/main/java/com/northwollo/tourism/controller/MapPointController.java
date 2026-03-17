package com.northwollo.tourism.controller;

import com.northwollo.tourism.dto.response.MapPointDto;
import com.northwollo.tourism.service.MapPointService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/map-points")
@RequiredArgsConstructor
public class MapPointController {

    private final MapPointService mapPointService;

    @GetMapping("/{id}")
    public ResponseEntity<MapPointDto> getMapPoint(@PathVariable Long id) {
        return ResponseEntity.ok(mapPointService.getMapPoint(id));
    }

    @GetMapping("/tourism/{tourismPlaceId}")
    public ResponseEntity<List<MapPointDto>> getActiveByTourismPlace(@PathVariable Long tourismPlaceId) {
        return ResponseEntity.ok(mapPointService.getActiveMapPointsByTourismPlace(tourismPlaceId));
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<MapPointDto>> getActiveByType(@PathVariable String type) {
        return ResponseEntity.ok(mapPointService.getActiveMapPointsByType(type));
    }

    @GetMapping("/road/{roadInfoId}")
    public ResponseEntity<List<MapPointDto>> getActiveByRoad(@PathVariable Long roadInfoId) {
        return ResponseEntity.ok(mapPointService.getActiveMapPointsByRoad(roadInfoId));
    }

    @GetMapping("/distance")
    public ResponseEntity<Double> calculateDistance(
            @RequestParam Double fromLat,
            @RequestParam Double fromLng,
            @RequestParam Double toLat,
            @RequestParam Double toLng
    ) {
        double distance = mapPointService.calculateDistance(fromLat, fromLng, toLat, toLng);
        return ResponseEntity.ok(distance);
    }
}
