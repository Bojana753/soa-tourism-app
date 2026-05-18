package com.example.tourservice.controller;

import com.example.tourservice.dto.TourDtos.*;
import com.example.tourservice.service.PositionSimulatorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/position")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PositionSimulatorController {

    private final PositionSimulatorService positionService;

    @PutMapping("/{touristId}")
    public ResponseEntity<PositionResponse> updatePosition(@PathVariable Long touristId,
                                                            @Valid @RequestBody UpdatePositionRequest req) {
        return ResponseEntity.ok(positionService.updatePosition(touristId, req));
    }

    @GetMapping("/{touristId}")
    public ResponseEntity<PositionResponse> getPosition(@PathVariable Long touristId) {
        return ResponseEntity.ok(positionService.getPosition(touristId));
    }
}
