package com.example.tourservice.repository;

import com.example.tourservice.model.TourExecution;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TourExecutionRepository extends JpaRepository<TourExecution, Long> {
    Optional<TourExecution> findFirstByTouristIdAndStatus(Long touristId, TourExecution.ExecutionStatus status);
    List<TourExecution> findByTouristIdOrderByStartedAtDesc(Long touristId);
}
