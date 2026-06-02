package com.example.purchaseservice.repository;

import com.example.purchaseservice.model.ShoppingCart;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ShoppingCartRepository extends JpaRepository<ShoppingCart, Long> {
    Optional<ShoppingCart> findByTouristId(Long touristId);
}
