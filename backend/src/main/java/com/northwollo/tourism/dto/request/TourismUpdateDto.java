package com.northwollo.tourism.dto.request;

import com.northwollo.tourism.enums.PlaceStatus;
import com.northwollo.tourism.enums.TourismCategory;

import java.util.List;

public class TourismUpdateDto {

    private String name;
    private TourismCategory category;
    private String description;
    private String wereda;
    private String kebele;
    private String bestTime;
    private String peaceInfo;
    private String visitTime; // ISO-8601 duration
    private List<String> languages;
    private PlaceStatus status;
    private String imageUrl;

    // ===== Getters & Setters =====
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public TourismCategory getCategory() { return category; }
    public void setCategory(TourismCategory category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getWereda() { return wereda; }
    public void setWereda(String wereda) { this.wereda = wereda; }

    public String getKebele() { return kebele; }
    public void setKebele(String kebele) { this.kebele = kebele; }

    public String getBestTime() { return bestTime; }
    public void setBestTime(String bestTime) { this.bestTime = bestTime; }

    public String getPeaceInfo() { return peaceInfo; }
    public void setPeaceInfo(String peaceInfo) { this.peaceInfo = peaceInfo; }

    public String getVisitTime() { return visitTime; }
    public void setVisitTime(String visitTime) { this.visitTime = visitTime; }

    public List<String> getLanguages() { return languages; }
    public void setLanguages(List<String> languages) { this.languages = languages; }

    public PlaceStatus getStatus() { return status; }
    public void setStatus(PlaceStatus status) { this.status = status; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}
