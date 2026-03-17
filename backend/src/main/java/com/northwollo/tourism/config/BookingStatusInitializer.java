package com.northwollo.tourism.config;

import com.northwollo.tourism.entity.BookingStatusEntity;
import com.northwollo.tourism.repository.BookingStatusRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

/**
 * Initializes required booking statuses on application startup.
 * This ensures all necessary statuses exist in the database.
 */
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class BookingStatusInitializer implements CommandLineRunner {

    private final BookingStatusRepository statusRepository;

    // All required booking statuses
    private static final List<String> REQUIRED_STATUSES = Arrays.asList(
        "REQUESTED",        // Initial status when client creates booking
        "OWNER_ACCEPTED",   // Owner accepted the booking request
        "COST_PROPOSED",    // Owner proposed a cost
        "PAID",             // Client uploaded payment receipt
        "APPROVED",         // Owner approved after verifying payment
        "REJECTED",         // Owner rejected the booking
        "CANCELLED"         // Booking was cancelled
    );

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Initializing booking statuses...");
        
        for (String statusName : REQUIRED_STATUSES) {
            if (statusRepository.findByName(statusName).isEmpty()) {
                BookingStatusEntity status = BookingStatusEntity.builder()
                    .name(statusName)
                    .build();
                statusRepository.save(status);
                log.info("Created booking status: {}", statusName);
            } else {
                log.debug("Booking status already exists: {}", statusName);
            }
        }
        
        log.info("Booking status initialization complete. Total statuses: {}", statusRepository.count());
    }
}
