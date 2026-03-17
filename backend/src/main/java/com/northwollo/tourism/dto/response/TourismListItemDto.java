package com.northwollo.tourism.dto.response;

import com.northwollo.tourism.entity.TourismPlace;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Simple DTO for listing tourism places in dropdowns
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TourismListItemDto {
    private Long id;
    private String name;
    private String wereda;
    private String kebele;
    private String category;

    public static TourismListItemDto fromEntity(TourismPlace place) {
        TourismListItemDto dto = new TourismListItemDto();
        dto.setId(place.getId());
        dto.setName(place.getName());
        dto.setWereda(place.getWereda());
        dto.setKebele(place.getKebele());
        dto.setCategory(place.getCategory() != null ? place.getCategory().name() : null);
        return dto;
    }
}
