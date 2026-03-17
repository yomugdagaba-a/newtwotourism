package com.northwollo.tourism.service.impl;

import com.northwollo.tourism.dto.request.UserUpdateDto;
import com.northwollo.tourism.dto.response.UserDto;
import com.northwollo.tourism.entity.Hotel;
import com.northwollo.tourism.entity.Role;
import com.northwollo.tourism.entity.User;
import com.northwollo.tourism.repository.HotelBookingRepository;
import com.northwollo.tourism.repository.HotelRepository;
import com.northwollo.tourism.repository.RefreshTokenRepository;
import com.northwollo.tourism.repository.RoleRepository;
import com.northwollo.tourism.repository.UserRepository;
import com.northwollo.tourism.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final HotelBookingRepository hotelBookingRepository;
    private final HotelRepository hotelRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    @Override
    public Page<UserDto> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toDto);
    }

    @Override
    public Page<UserDto> searchUsers(String search, Pageable pageable) {
        if (search == null || search.isBlank()) {
            return userRepository.findAll(pageable).map(this::toDto);
        }
        return userRepository.searchUsers(search.trim(), pageable).map(this::toDto);
    }

    @Override
    public UserDto getUserById(Long userId) {
        User user = getUser(userId);
        return toDto(user);
    }

    @Override
    public List<UserDto> getUsersByRole(String roleName) {
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found"));
        return userRepository.findByRolesContaining(role).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserDto updateUser(Long userId, UserUpdateDto dto) {
        User user = getUser(userId);

        if (dto.getUsername() != null && !dto.getUsername().isBlank()) {
            // Check if username is already taken by another user
            userRepository.findByUsername(dto.getUsername())
                    .filter(u -> !u.getId().equals(userId))
                    .ifPresent(u -> {
                        throw new RuntimeException("Username already taken");
                    });
            user.setUsername(dto.getUsername());
        }

        if (dto.getEmail() != null && !dto.getEmail().isBlank()) {
            // Check if email is already taken by another user
            userRepository.findByEmail(dto.getEmail())
                    .filter(u -> !u.getId().equals(userId))
                    .ifPresent(u -> {
                        throw new RuntimeException("Email already taken");
                    });
            user.setEmail(dto.getEmail());
        }

        if (dto.getFullName() != null && !dto.getFullName().isBlank()) {
            user.setFullName(dto.getFullName());
        }

        if (dto.getActive() != null) {
            user.setActive(dto.getActive());
        }

        if (dto.getEmailVerified() != null) {
            user.setEmailVerified(dto.getEmailVerified());
            if (dto.getEmailVerified()) {
                user.setEmailVerifiedAt(LocalDateTime.now());
            }
        }

        userRepository.save(user);
        return toDto(user);
    }

    @Override
    public void activateUser(Long userId) {
        User user = getUser(userId);
        user.setActive(true);
        userRepository.save(user);
    }

    @Override
    public void deactivateUser(Long userId) {
        User user = getUser(userId);
        user.setActive(false);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void deleteUser(Long userId) {
        User user = getUser(userId);
        
        // Check if user has any bookings
        var bookings = hotelBookingRepository.findByUserId(userId);
        if (!bookings.isEmpty()) {
            throw new RuntimeException("Cannot delete user with existing bookings. Please cancel or delete the bookings first. User has " + bookings.size() + " booking(s).");
        }
        
        // Remove user as owner from any hotels
        List<Hotel> ownedHotels = hotelRepository.findByOwnerId(userId);
        for (Hotel hotel : ownedHotels) {
            hotel.setOwner(null);
            hotelRepository.save(hotel);
        }
        
        // Delete refresh tokens
        refreshTokenRepository.deleteAllTokensByUserId(userId);
        
        // Now delete the user
        userRepository.delete(user);
    }

    @Override
    public void grantRole(Long userId, String roleName) {
        User user = getUser(userId);
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found"));
        user.getRoles().add(role);
        userRepository.save(user);
    }

    @Override
    public void revokeRole(Long userId, String roleName) {
        User user = getUser(userId);
        user.getRoles().removeIf(r -> r.getName().equals(roleName));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void resetUserPassword(Long userId, String newPassword) {
        User user = getUser(userId);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(user.getRoles().stream()
                        .map(Role::getName)
                        .collect(Collectors.toSet()))
                .active(user.isActive())
                .emailVerified(user.isEmailVerified())
                .createdAt(user.getCreatedAt())
                .emailVerifiedAt(user.getEmailVerifiedAt())
                .build();
    }
}
