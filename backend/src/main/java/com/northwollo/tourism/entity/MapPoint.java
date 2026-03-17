package com.northwollo.tourism.entity;
import com.northwollo.tourism.enums.MapPointType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Entity
@Table(name = "map_points")
@Data
public class MapPoint extends BaseEntity {

    @NotBlank
    private String name; // e.g., tourism place, hotel, road name

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    @Enumerated(EnumType.STRING)
    private MapPointType type; // ENUM: TOURISM_PLACE, HOTEL, ROAD

    private String description;

    private boolean active = true;

    @ManyToOne
    @JoinColumn(name = "tourism_place_id")
    private TourismPlace tourismPlace;

    @ManyToOne
    @JoinColumn(name = "hotel_id")
    private Hotel hotel;

    @ManyToOne
    @JoinColumn(name = "road_info_id")
    private RoadInfo roadInfo;
}
