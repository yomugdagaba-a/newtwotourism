package com.northwollo.tourism.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Entity
@Table(name = "language_guiders")
@Data
public class LanguageGuider extends BaseEntity {

    @NotBlank
    private String fullName;

    @NotBlank
    private String contactInfo;

    @ElementCollection
    @CollectionTable(name = "guider_languages", joinColumns = @JoinColumn(name = "guider_id"))
    @Column(name = "language")
    private List<String> languages; // languages the guider knows

    @ManyToOne
    @JoinColumn(name = "tourism_place_id")
    @NotNull
    private TourismPlace tourismPlace;

    private boolean active = true; // active for searching
}
