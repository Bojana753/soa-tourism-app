package com.example.tourservice.repository;

import com.example.tourservice.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByTourId(Long tourId);
}
