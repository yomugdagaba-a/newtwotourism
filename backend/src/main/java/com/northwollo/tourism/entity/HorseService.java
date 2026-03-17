package com.northwollo.tourism.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;  // ✅ Import added

@Entity
@Table(name = "horse_services")
@Data
public class HorseService extends BaseEntity {

    @NotNull
    @ManyToOne
    @JoinColumn(name = "road_info_id", nullable = false)
    private RoadInfo roadInfo;

    @NotBlank
    private String ownerName;

    @NotBlank
    private String contactInfo;

    @NotBlank
    private String initialPlace;

    @Positive
    private double cost;
}
