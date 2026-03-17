package com.northwollo.tourism.controller;

import com.northwollo.tourism.dto.request.LanguageGuiderCreateDto;
import com.northwollo.tourism.dto.request.LanguageGuiderUpdateDto;
import com.northwollo.tourism.service.LanguageGuiderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/guiders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminLanguageGuiderController {

    private final LanguageGuiderService guiderService;

    @PostMapping
    public ResponseEntity<Long> create(@Valid @RequestBody LanguageGuiderCreateDto dto) {
        return ResponseEntity.ok(guiderService.createGuider(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable Long id, @Valid @RequestBody LanguageGuiderUpdateDto dto) {
        guiderService.updateGuider(id, dto);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        guiderService.deleteGuider(id);
        return ResponseEntity.ok().build();
    }
}
