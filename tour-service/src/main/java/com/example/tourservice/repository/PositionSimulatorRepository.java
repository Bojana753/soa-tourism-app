package com.example.tourservice.repository;

import com.example.tourservice.model.PositionSimulator;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PositionSimulatorRepository extends JpaRepository<PositionSimulator, Long> {
    Optional<PositionSimulator> findByTouristId(Long touristId);
}
