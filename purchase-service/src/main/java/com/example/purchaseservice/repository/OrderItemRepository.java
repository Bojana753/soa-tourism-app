package com.example.purchaseservice.repository;

import com.example.purchaseservice.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByCartId(Long cartId);
}
