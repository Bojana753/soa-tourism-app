package com.example.tourservice.repository;

import com.example.tourservice.model.Tour;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;import java.util.List;

public interface TourRepository extends JpaRepository<Tour, Long> {
    List<Tour> findByAuthorId(Long authorId);
    List<Tour> findByStatus(Tour.TourStatus status);

    @Query("SELECT DISTINCT t FROM Tour t LEFT JOIN FETCH t.tags WHERE t.status = :status")
List<Tour> findByStatusWithTags(@Param("status") Tour.TourStatus status);
}
