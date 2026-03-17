package com.northwollo.tourism.service;

import com.northwollo.tourism.dto.request.TourismCreateDto;
import com.northwollo.tourism.dto.request.TourismImageCreateDto;
import com.northwollo.tourism.dto.request.TourismUpdateDto;
import com.northwollo.tourism.dto.response.TourismAdminDto;
import com.northwollo.tourism.dto.response.TourismFullDetailDto;
import com.northwollo.tourism.dto.response.TourismImageDto;
import com.northwollo.tourism.dto.response.TourismListItemDto;
import com.northwollo.tourism.dto.response.TourismPublicCardDto;
import com.northwollo.tourism.enums.TourismCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface TourismService {

    // ==============================
    // Admin CRUD
    // ==============================
    Long create(TourismCreateDto dto);
    void update(Long id, TourismUpdateDto dto);
    void delete(Long id);
    
    // ==============================
    // List all tourism places (for admin dropdowns - simple)
    // ==============================
    List<TourismListItemDto> getAllTourismPlaces();
    
    // ==============================
    // List all tourism places (for admin page - full details)
    // ==============================
    List<TourismAdminDto> getAllTourismPlacesForAdmin();

    // ==============================
    // Image Management
    // ==============================
    List<TourismImageDto> getImages(Long tourismId);
    TourismImageDto addImage(Long tourismId, TourismImageCreateDto dto);
    TourismImageDto updateImage(Long tourismId, Long imageId, TourismImageCreateDto dto);
    void deleteImage(Long tourismId, Long imageId);
    void setMainImage(Long tourismId, Long imageId);
    void reorderImages(Long tourismId, List<Long> imageIds);

    // ==============================
    // Public listing - FRONTEND USES THIS
    // ==============================

    // ==============================
    // Public detail
    // ==============================
    TourismFullDetailDto getFullDetail(Long placeId);
}
