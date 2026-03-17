package com.northwollo.tourism.repository;

import com.northwollo.tourism.entity.BookingMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingMessageRepository extends JpaRepository<BookingMessage, Long> {
    
    List<BookingMessage> findByBookingIdOrderByCreatedAtAsc(Long bookingId);
    
    List<BookingMessage> findByBookingIdAndIsReadFalse(Long bookingId);
    
    long countByBookingIdAndIsReadFalseAndSenderIdNot(Long bookingId, Long senderId);
}
