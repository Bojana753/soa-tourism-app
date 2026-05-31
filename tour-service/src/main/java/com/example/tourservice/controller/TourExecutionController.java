package com.example.tourservice.controller;

import com.example.tourservice.dto.ExecutionDtos.StartTourExecutionRequest;
import com.example.tourservice.dto.ExecutionDtos.TourExecutionResponse;
import com.example.tourservice.service.TourExecutionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/executions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TourExecutionController {

    private final TourExecutionService executionService;

    @PostMapping("/start")
    public ResponseEntity<TourExecutionResponse> startExecution(
            @Valid @RequestBody StartTourExecutionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(executionService.startExecution(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TourExecutionResponse> getExecution(@PathVariable Long id) {
        return ResponseEntity.ok(executionService.getExecution(id));
    }

    @GetMapping("/tourist/{touristId}")
    public ResponseEntity<List<TourExecutionResponse>> getExecutionsForTourist(@PathVariable Long touristId) {
        return ResponseEntity.ok(executionService.getExecutionsForTourist(touristId));
    }
}
