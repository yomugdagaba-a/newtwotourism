package com.northwollo.tourism.entity;

import com.northwollo.tourism.enums.RoadType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "road_infos")
@Data
public class RoadInfo extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tourism_place_id")
    private TourismPlace tourismPlace;

    // ✅ NEW: Initial place field
    @NotNull
    @Column(nullable = false, length = 200)
    private String initialPlace;

    @NotNull
    @Enumerated(EnumType.STRING)
    private RoadType roadType;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Double distanceByCar;
    private Double distanceByFoot;
    private Double distanceByPlane;
    private Double distanceByHorse;
    private Double totalDistance;

    @OneToMany(mappedBy = "roadInfo", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<HorseService> horseServices = new ArrayList<>();
}
