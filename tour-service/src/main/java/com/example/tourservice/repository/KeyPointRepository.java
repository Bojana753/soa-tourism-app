package com.example.tourservice.repository;

import com.example.tourservice.model.KeyPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface KeyPointRepository extends JpaRepository<KeyPoint, Long> {
    List<KeyPoint> findByTourIdOrderByOrderIndex(Long tourId);
    void deleteByTourId(Long tourId);
}
