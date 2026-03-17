package com.northwollo.tourism.service.impl;

import com.northwollo.tourism.dto.request.BookingRequestDto;
import com.northwollo.tourism.dto.response.HotelBookingResponseDto;
import com.northwollo.tourism.entity.*;
import com.northwollo.tourism.repository.*;
import com.northwollo.tourism.service.BookingService;
import com.northwollo.tourism.service.EmailService;
import com.northwollo.tourism.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingServiceImpl implements BookingService {

    private final HotelBookingRepository bookingRepository;
    private final HotelRepository hotelRepository;
    private final UserRepository userRepository;
    private final BookingStatusRepository statusRepository;
    private final BookingMessageRepository messageRepository;
    private final EmailService emailService;
    private final FileUploadService fileUploadService;

    @Override
    @Transactional
    public HotelBookingResponseDto createBooking(BookingRequestDto dto, Long userId) {
        Hotel hotel = hotelRepository.findById(dto.getHotelId())
                .orElseThrow(() -> new RuntimeException("Hotel not found"));

        if (!hotel.isActive()) {
            throw new RuntimeException("Hotel is not currently accepting bookings");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        BookingStatusEntity requestedStatus = statusRepository.findByName("REQUESTED")
                .orElseThrow(() -> new RuntimeException("Booking status REQUESTED not found"));

        HotelBooking booking = HotelBooking.builder()
                .hotel(hotel)
                .user(user)
                .checkIn(dto.getCheckIn())
                .checkOut(dto.getCheckOut())
                .numberOfGuests(dto.getNumberOfGuests())
                .numberOfRooms(dto.getNumberOfRooms())
                .specialRequests(dto.getSpecialRequests())
                .clientPhone(dto.getClientPhone() != null ? dto.getClientPhone() : user.getEmail())
                .clientEmail(dto.getClientEmail() != null ? dto.getClientEmail() : user.getEmail())
                .status(requestedStatus)
                .build();

        booking = bookingRepository.save(booking);
        addMessage(booking, user, "Booking request submitted", BookingMessage.MessageType.BOOKING_REQUEST);
        
        // Send email notification to hotel owner
        if (hotel.getOwner() != null && hotel.getOwner().getEmail() != null) {
            try {
                emailService.sendNewBookingNotification(
                    hotel.getOwner().getEmail(),
                    user.getFullName(),
                    hotel.getName(),
                    dto.getCheckIn().toString(),
                    dto.getCheckOut().toString(),
                    dto.getNumberOfGuests()
                );
            } catch (Exception e) {
                log.error("Failed to send new booking notification email: {}", e.getMessage());
            }
        }
        
        return mapToDto(booking);
    }

    @Override
    public List<HotelBookingResponseDto> getMyBookings(Long userId) {
        return bookingRepository.findByUserId(userId).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public HotelBookingResponseDto getBookingById(Long bookingId, Long userId) {
        HotelBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (!booking.getUser().getId().equals(userId) && 
            (booking.getHotel().getOwner() == null || !booking.getHotel().getOwner().getId().equals(userId))) {
            throw new RuntimeException("Unauthorized access");
        }
        return mapToDto(booking);
    }

    @Override
    @Transactional
    public HotelBookingResponseDto uploadReceipt(Long bookingId, String receiptUrl, Long userId) {
        HotelBooking booking = bookingRepository.findByIdAndUserId(bookingId, userId)
                .orElseThrow(() -> new RuntimeException("Unauthorized"));
        if (!booking.canUploadReceipt()) throw new RuntimeException("Cannot upload receipt now");
        
        BookingStatusEntity paidStatus = statusRepository.findByName("PAID")
                .orElseThrow(() -> new RuntimeException("Status PAID not found"));
        booking.setReceiptImageUrl(receiptUrl);
        booking.setStatus(paidStatus);
        booking = bookingRepository.save(booking);
        addMessage(booking, booking.getUser(), "Receipt uploaded", BookingMessage.MessageType.RECEIPT_UPLOADED);
        
        // Send email notification to hotel owner
        if (booking.getHotel().getOwner() != null && booking.getHotel().getOwner().getEmail() != null) {
            try {
                emailService.sendReceiptUploadedNotification(
                    booking.getHotel().getOwner().getEmail(),
                    booking.getUser().getFullName(),
                    booking.getHotel().getName(),
                    booking.getId()
                );
            } catch (Exception e) {
                log.error("Failed to send receipt uploaded notification email: {}", e.getMessage());
            }
        }
        
        return mapToDto(booking);
    }

    @Override
    @Transactional
    public HotelBookingResponseDto uploadReceiptFile(Long bookingId, MultipartFile file, Long userId) {
        HotelBooking booking = bookingRepository.findByIdAndUserId(bookingId, userId)
                .orElseThrow(() -> new RuntimeException("Unauthorized"));
        if (!booking.canUploadReceipt()) throw new RuntimeException("Cannot upload receipt now");
        
        // Upload the file and get the URL
        String receiptUrl = fileUploadService.uploadFile(file, "receipts");
        
        BookingStatusEntity paidStatus = statusRepository.findByName("PAID")
                .orElseThrow(() -> new RuntimeException("Status PAID not found"));
        booking.setReceiptImageUrl(receiptUrl);
        booking.setStatus(paidStatus);
        booking = bookingRepository.save(booking);
        addMessage(booking, booking.getUser(), "Receipt uploaded", BookingMessage.MessageType.RECEIPT_UPLOADED);
        
        // Send email notification to hotel owner
        if (booking.getHotel().getOwner() != null && booking.getHotel().getOwner().getEmail() != null) {
            try {
                emailService.sendReceiptUploadedNotification(
                    booking.getHotel().getOwner().getEmail(),
                    booking.getUser().getFullName(),
                    booking.getHotel().getName(),
                    booking.getId()
                );
            } catch (Exception e) {
                log.error("Failed to send receipt uploaded notification email: {}", e.getMessage());
            }
        }
        
        return mapToDto(booking);
    }

    @Override
    @Transactional
    public HotelBookingResponseDto reportProblem(Long bookingId, String problem, Long userId) {
        HotelBooking booking = bookingRepository.findByIdAndUserId(bookingId, userId)
                .orElseThrow(() -> new RuntimeException("Unauthorized"));
        booking.setProblemReport(problem);
        booking.setProblemReported(true);
        booking = bookingRepository.save(booking);
        addMessage(booking, booking.getUser(), "Problem: " + problem, BookingMessage.MessageType.PROBLEM_REPORT);
        return mapToDto(booking);
    }

    @Override
    @Transactional
    public HotelBookingResponseDto sendMessage(Long bookingId, String message, Long userId) {
        HotelBooking booking = bookingRepository.findByIdAndUserId(bookingId, userId)
                .orElseThrow(() -> new RuntimeException("Unauthorized"));
        addMessage(booking, booking.getUser(), message, BookingMessage.MessageType.GENERAL);
        return mapToDto(booking);
    }

    @Override
    public List<HotelBookingResponseDto> getHotelBookings(Long hotelId, Long ownerId) {
        Hotel hotel = hotelRepository.findById(hotelId).orElseThrow(() -> new RuntimeException("Hotel not found"));
        if (hotel.getOwner() == null || !hotel.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Not owner");
        }
        return bookingRepository.findByHotelId(hotelId).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public List<HotelBookingResponseDto> getOwnerBookings(Long ownerId) {
        return bookingRepository.findByHotelOwnerId(ownerId).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public HotelBookingResponseDto acceptBookingRequest(Long bookingId, Long ownerId) {
        HotelBooking booking = getBookingForOwner(bookingId, ownerId);
        if (!"REQUESTED".equals(booking.getStatus().getName())) throw new RuntimeException("Not in REQUESTED status");
        
        // Status must exist in database - do NOT create dynamically as it causes FK issues
        BookingStatusEntity status = statusRepository.findByName("OWNER_ACCEPTED")
                .orElseThrow(() -> new RuntimeException("Booking status 'OWNER_ACCEPTED' not found in database. Please add it to the booking_statuses table."));
        
        booking.setStatus(status);
        booking = bookingRepository.save(booking);
        addMessage(booking, booking.getHotel().getOwner(), "Request accepted", BookingMessage.MessageType.GENERAL);
        
        // Send email notification to client
        String clientEmail = booking.getClientEmail() != null ? booking.getClientEmail() : booking.getUser().getEmail();
        if (clientEmail != null) {
            try {
                emailService.sendBookingAcceptedNotification(
                    clientEmail,
                    booking.getHotel().getName(),
                    booking.getId()
                );
            } catch (Exception e) {
                log.error("Failed to send booking accepted notification email: {}", e.getMessage());
            }
        }
        
        return mapToDto(booking);
    }

    @Override
    @Transactional
    public HotelBookingResponseDto proposeCost(Long bookingId, BigDecimal cost, Long ownerId) {
        HotelBooking booking = getBookingForOwner(bookingId, ownerId);
        if (!booking.canProposeCost()) throw new RuntimeException("Cannot propose cost now");
        
        BookingStatusEntity status = statusRepository.findByName("COST_PROPOSED")
                .orElseThrow(() -> new RuntimeException("Status not found"));
        booking.setTotalCost(cost);
        booking.setStatus(status);
        booking = bookingRepository.save(booking);
        addMessage(booking, booking.getHotel().getOwner(), "Cost: " + cost + " ETB", BookingMessage.MessageType.COST_PROPOSAL);
        
        // Send email notification to client
        String clientEmail = booking.getClientEmail() != null ? booking.getClientEmail() : booking.getUser().getEmail();
        if (clientEmail != null) {
            try {
                emailService.sendCostProposedNotification(
                    clientEmail,
                    booking.getHotel().getName(),
                    cost.toString(),
                    booking.getId()
                );
            } catch (Exception e) {
                log.error("Failed to send cost proposed notification email: {}", e.getMessage());
            }
        }
        
        return mapToDto(booking);
    }

    @Override
    @Transactional
    public HotelBookingResponseDto approveBooking(Long bookingId, Long ownerId) {
        HotelBooking booking = getBookingForOwner(bookingId, ownerId);
        if (!booking.canApprove()) throw new RuntimeException("Cannot approve - not paid");
        
        BookingStatusEntity status = statusRepository.findByName("APPROVED")
                .orElseThrow(() -> new RuntimeException("Status not found"));
        booking.setStatus(status);
        booking = bookingRepository.save(booking);
        addMessage(booking, booking.getHotel().getOwner(), "APPROVED!", BookingMessage.MessageType.BOOKING_APPROVED);
        
        // Send email notification to client
        String clientEmail = booking.getClientEmail() != null ? booking.getClientEmail() : booking.getUser().getEmail();
        if (clientEmail != null) {
            try {
                emailService.sendBookingApprovedNotification(
                    clientEmail,
                    booking.getHotel().getName(),
                    booking.getCheckIn().toString(),
                    booking.getCheckOut().toString(),
                    booking.getId()
                );
            } catch (Exception e) {
                log.error("Failed to send booking approved notification email: {}", e.getMessage());
            }
        }
        
        return mapToDto(booking);
    }

    @Override
    @Transactional
    public HotelBookingResponseDto rejectBooking(Long bookingId, String reason, Long ownerId) {
        HotelBooking booking = getBookingForOwner(bookingId, ownerId);
        BookingStatusEntity status = statusRepository.findByName("REJECTED")
                .orElseThrow(() -> new RuntimeException("Status not found"));
        booking.setStatus(status);
        booking.setRejectionReason(reason);
        booking = bookingRepository.save(booking);
        addMessage(booking, booking.getHotel().getOwner(), "Rejected: " + reason, BookingMessage.MessageType.BOOKING_REJECTED);
        
        // Send email notification to client
        String clientEmail = booking.getClientEmail() != null ? booking.getClientEmail() : booking.getUser().getEmail();
        if (clientEmail != null) {
            try {
                emailService.sendBookingRejectedNotification(
                    clientEmail,
                    booking.getHotel().getName(),
                    reason,
                    booking.getId()
                );
            } catch (Exception e) {
                log.error("Failed to send booking rejected notification email: {}", e.getMessage());
            }
        }
        
        return mapToDto(booking);
    }

    @Override
    @Transactional
    public HotelBookingResponseDto ownerSendMessage(Long bookingId, String message, Long ownerId) {
        HotelBooking booking = getBookingForOwner(bookingId, ownerId);
        addMessage(booking, booking.getHotel().getOwner(), message, BookingMessage.MessageType.GENERAL);
        return mapToDto(booking);
    }

    @Override
    public List<HotelBookingResponseDto> getAllBookings(int page, int size) {
        return bookingRepository.findAll(PageRequest.of(page, size)).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public List<HotelBookingResponseDto> getProblemBookings() {
        return bookingRepository.findByProblemReportedTrue().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public HotelBookingResponseDto adminResolve(Long bookingId, String resolution) {
        HotelBooking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new RuntimeException("Not found"));
        booking.setProblemReported(false);
        return mapToDto(bookingRepository.save(booking));
    }

    private HotelBooking getBookingForOwner(Long bookingId, Long ownerId) {
        HotelBooking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new RuntimeException("Not found"));
        if (booking.getHotel().getOwner() == null || !booking.getHotel().getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Not owner");
        }
        return booking;
    }

    private void addMessage(HotelBooking booking, User sender, String msg, BookingMessage.MessageType type) {
        messageRepository.save(BookingMessage.builder().booking(booking).sender(sender).message(msg).messageType(type).build());
    }

    private HotelBookingResponseDto mapToDto(HotelBooking b) {
        List<HotelBookingResponseDto.MessageDto> msgs = messageRepository.findByBookingIdOrderByCreatedAtAsc(b.getId())
                .stream().map(m -> HotelBookingResponseDto.MessageDto.builder()
                        .id(m.getId()).senderId(m.getSender().getId()).senderName(m.getSender().getFullName())
                        .message(m.getMessage()).messageType(m.getMessageType().name()).isRead(m.isRead())
                        .createdAt(m.getCreatedAt()).build()).collect(Collectors.toList());

        return HotelBookingResponseDto.builder()
                .bookingId(b.getId())
                .hotel(HotelBookingResponseDto.HotelDto.builder()
                        .id(b.getHotel().getId()).name(b.getHotel().getName()).contactInfo(b.getHotel().getContactInfo())
                        .active(b.getHotel().isActive())
                        .ownerId(b.getHotel().getOwner() != null ? b.getHotel().getOwner().getId() : null)
                        .ownerName(b.getHotel().getOwner() != null ? b.getHotel().getOwner().getFullName() : null).build())
                .client(HotelBookingResponseDto.ClientDto.builder()
                        .id(b.getUser().getId()).username(b.getUser().getUsername()).fullName(b.getUser().getFullName())
                        .email(b.getClientEmail()).phone(b.getClientPhone()).build())
                .checkIn(b.getCheckIn()).checkOut(b.getCheckOut()).numberOfGuests(b.getNumberOfGuests())
                .numberOfRooms(b.getNumberOfRooms()).specialRequests(b.getSpecialRequests())
                .bookingStatus(b.getStatus().getName()).totalCost(b.getTotalCost()).receiptImageUrl(b.getReceiptImageUrl())
                .rejectionReason(b.getRejectionReason()).problemReport(b.getProblemReport()).problemReported(b.getProblemReported() != null && b.getProblemReported())
                .createdAt(b.getCreatedAt()).updatedAt(b.getUpdatedAt()).messages(msgs).build();
    }
}
