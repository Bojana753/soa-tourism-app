package com.example.tourservice.repository;

import com.example.tourservice.model.Tour;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TourRepository extends JpaRepository<Tour, Long> {
    List<Tour> findByAuthorId(Long authorId);
    List<Tour> findByStatus(Tour.TourStatus status);
}
