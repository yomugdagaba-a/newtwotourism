package com.northwollo.tourism.repository;

import com.northwollo.tourism.entity.BookingStatusEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BookingStatusRepository extends JpaRepository<BookingStatusEntity, Long> {
    Optional<BookingStatusEntity> findByName(String name);
}
