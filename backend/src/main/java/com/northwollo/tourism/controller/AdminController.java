package com.northwollo.tourism.controller;

import com.northwollo.tourism.dto.request.AdminPasswordResetDto;
import com.northwollo.tourism.dto.request.UserUpdateDto;
import com.northwollo.tourism.dto.response.UserDto;
import com.northwollo.tourism.entity.Hotel;
import com.northwollo.tourism.entity.User;
import com.northwollo.tourism.repository.HotelRepository;
import com.northwollo.tourism.repository.UserRepository;
import com.northwollo.tourism.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;
    private final HotelRepository hotelRepository;
    private final UserRepository userRepository;

    // Get all users with pagination, sorting, and search
    @GetMapping("/users")
    public ResponseEntity<Page<UserDto>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String search) {
        Sort sort = sortDir.equalsIgnoreCase("desc") 
                ? Sort.by(sortBy).descending() 
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<UserDto> users = userService.searchUsers(search, pageable);
        return ResponseEntity.ok(users);
    }

    // Get user by ID
    @GetMapping("/users/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        UserDto user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    // Get users by role (for hotel owner assignment)
    @GetMapping("/users/role/{role}")
    public ResponseEntity<List<UserDto>> getUsersByRole(@PathVariable String role) {
        List<UserDto> users = userService.getUsersByRole(role.toUpperCase());
        return ResponseEntity.ok(users);
    }

    // Update user
    @PutMapping("/users/{id}")
    public ResponseEntity<UserDto> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserUpdateDto dto) {
        UserDto updated = userService.updateUser(id, dto);
        return ResponseEntity.ok(updated);
    }

    // Reset user password (Admin only)
    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<Void> resetUserPassword(
            @PathVariable Long id,
            @Valid @RequestBody AdminPasswordResetDto dto) {
        userService.resetUserPassword(id, dto.getNewPassword());
        return ResponseEntity.ok().build();
    }

    // Activate user
    @PatchMapping("/users/{id}/activate")
    public ResponseEntity<Void> activate(@PathVariable Long id) {
        userService.activateUser(id);
        return ResponseEntity.ok().build();
    }

    // Deactivate user
    @PatchMapping("/users/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        userService.deactivateUser(id);
        return ResponseEntity.ok().build();
    }

    // Delete user
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }

    // Grant role
    @PostMapping("/users/{id}/roles/{role}")
    public ResponseEntity<Void> grantRole(
            @PathVariable Long id,
            @PathVariable String role) {
        userService.grantRole(id, role.toUpperCase());
        return ResponseEntity.ok().build();
    }

    // Revoke role
    @DeleteMapping("/users/{id}/roles/{role}")
    public ResponseEntity<Void> revokeRole(
            @PathVariable Long id,
            @PathVariable String role) {
        userService.revokeRole(id, role.toUpperCase());
        return ResponseEntity.ok().build();
    }

    // ==================== HOTEL OWNER ASSIGNMENT ====================

    // Assign owner to hotel
    @PostMapping("/hotels/{hotelId}/owner/{userId}")
    public ResponseEntity<Void> assignHotelOwner(
            @PathVariable Long hotelId,
            @PathVariable Long userId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new RuntimeException("Hotel not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Ensure user has HOTEL_OWNER role
        boolean hasOwnerRole = user.getRoles().stream()
                .anyMatch(r -> "HOTEL_OWNER".equals(r.getName()));
        if (!hasOwnerRole) {
            throw new RuntimeException("User must have HOTEL_OWNER role");
        }
        
        hotel.setOwner(user);
        hotelRepository.save(hotel);
        return ResponseEntity.ok().build();
    }

    // Remove owner from hotel
    @DeleteMapping("/hotels/{hotelId}/owner")
    public ResponseEntity<Void> removeHotelOwner(@PathVariable Long hotelId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new RuntimeException("Hotel not found"));
        hotel.setOwner(null);
        hotelRepository.save(hotel);
        return ResponseEntity.ok().build();
    }

    // Toggle hotel active status
    @PatchMapping("/hotels/{hotelId}/active")
    public ResponseEntity<Void> toggleHotelActive(
            @PathVariable Long hotelId,
            @RequestParam boolean active) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new RuntimeException("Hotel not found"));
        hotel.setActive(active);
        hotelRepository.save(hotel);
        return ResponseEntity.ok().build();
    }
}
