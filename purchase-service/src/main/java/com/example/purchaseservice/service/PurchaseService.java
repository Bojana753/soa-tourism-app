package com.example.purchaseservice.service;

import com.example.purchaseservice.dto.PurchaseDtos.*;
import com.example.purchaseservice.exception.NotFoundException;
import com.example.purchaseservice.exception.ValidationException;
import com.example.purchaseservice.model.*;
import com.example.purchaseservice.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PurchaseService {

    private final ShoppingCartRepository cartRepository;
    private final OrderItemRepository orderItemRepository;
    private final TourPurchaseTokenRepository tokenRepository;
    private final RestTemplate restTemplate;

    @Value("${tour.service.url}")
    private String tourServiceUrl;

    @Value("${notifications.service.url:http://notifications-service:8087}")
    private String notificationsServiceUrl;


    @Transactional
    public CartResponse addToCart(AddToCartRequest req) {
        validateTourIsPublished(req.getTourId());
        if (tokenRepository.existsByTouristIdAndTourId(req.getTouristId(), req.getTourId())) {
    throw new ValidationException("You have already purchased this tour.");
}

        ShoppingCart cart = cartRepository.findByTouristId(req.getTouristId())
                .orElseGet(() -> {
                    ShoppingCart newCart = new ShoppingCart();
                    newCart.setTouristId(req.getTouristId());
                    return cartRepository.save(newCart);
                });

        boolean alreadyInCart = cart.getItems().stream()
                .anyMatch(item -> item.getTourId().equals(req.getTourId()));
        if (alreadyInCart) {
            throw new ValidationException("Tour is already in cart.");
        }

        OrderItem item = new OrderItem();
        item.setTourId(req.getTourId());
        item.setTourName(req.getTourName());
        item.setPrice(req.getPrice());
        item.setCart(cart);
        cart.getItems().add(item);

        recalculateTotal(cart);
        return toCartResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse removeFromCart(Long touristId, Long tourId) {
        ShoppingCart cart = findCart(touristId);
        cart.getItems().removeIf(item -> item.getTourId().equals(tourId));
        recalculateTotal(cart);
        return toCartResponse(cartRepository.save(cart));
    }

    public CartResponse getCart(Long touristId) {
        ShoppingCart cart = cartRepository.findByTouristId(touristId)
                .orElseGet(() -> {
                    ShoppingCart newCart = new ShoppingCart();
                    newCart.setTouristId(touristId);
                    return cartRepository.save(newCart);
                });
        return toCartResponse(cart);
    }

    @Transactional
    public CheckoutResponse checkout(Long touristId) {
        ShoppingCart cart = findCart(touristId);

        if (cart.getItems().isEmpty()) {
            throw new ValidationException("Cart is empty.");
        }

        List<TokenResponse> tokens = new ArrayList<>();
        List<OrderItem> failedItems = new ArrayList<>();

        for (OrderItem item : cart.getItems()) {
            try {
                validateTourIsPublished(item.getTourId());

                TourPurchaseToken token = new TourPurchaseToken();
                token.setTouristId(touristId);
                token.setTourId(item.getTourId());
                token.setTourName(item.getTourName());
                tokens.add(toTokenResponse(tokenRepository.save(token)));

sendNotification(touristId, "You purchased the tour: " + item.getTourName());

            } catch (ValidationException e) {
                log.warn("SAGA rollback: Tour {} is no longer available. Skipping.", item.getTourId());
                failedItems.add(item);
            }
        }

        CheckoutResponse response = new CheckoutResponse();
        response.setTokens(tokens);
        if (!failedItems.isEmpty()) {
            response.setMessage("Some tours were no longer available and were removed from your cart: "
                    + failedItems.stream().map(OrderItem::getTourName).collect(Collectors.joining(", ")));
        } else {
            response.setMessage("Checkout successful! You can now start your tours.");
        }

        cart.getItems().clear();
        cart.setTotalPrice(0.0);
        cartRepository.save(cart);

        return response;
    }

    public PurchaseCheckResponse checkPurchase(Long touristId, Long tourId) {
        PurchaseCheckResponse response = new PurchaseCheckResponse();
        response.setTouristId(touristId);
        response.setTourId(tourId);
        response.setPurchased(tokenRepository.existsByTouristIdAndTourId(touristId, tourId));
        return response;
    }

    public List<TokenResponse> getTokensForTourist(Long touristId) {
        return tokenRepository.findByTouristId(touristId)
                .stream().map(this::toTokenResponse).collect(Collectors.toList());
    }

    private void validateTourIsPublished(Long tourId) {
        try {
            String url = tourServiceUrl + "/api/tours/" + tourId + "/status";
            TourStatusResponse status = restTemplate.getForObject(url, TourStatusResponse.class);
            if (status == null || !"PUBLISHED".equals(status.getStatus())) {
                throw new ValidationException("Tour " + tourId + " is not available for purchase (status: "
                        + (status != null ? status.getStatus() : "unknown") + ").");
            }
        } catch (ValidationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Could not reach tour-service to validate tour {}: {}", tourId, e.getMessage());
            throw new ValidationException("Could not validate tour availability. Please try again.");
        }
    }

    private void sendNotification(Long userId, String message) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("userId", userId);
            body.put("message", message);
            restTemplate.postForObject(notificationsServiceUrl + "/api/notifications", body, Object.class);
        } catch (Exception e) {
            log.warn("Could not send notification to user {}: {}", userId, e.getMessage());
        }
    }

    private void recalculateTotal(ShoppingCart cart) {
        double total = cart.getItems().stream()
                .mapToDouble(OrderItem::getPrice)
                .sum();
        cart.setTotalPrice(Math.round(total * 100.0) / 100.0);
    }

    private ShoppingCart findCart(Long touristId) {
        return cartRepository.findByTouristId(touristId)
                .orElseThrow(() -> new NotFoundException("Cart not found for tourist: " + touristId));
    }

    private CartResponse toCartResponse(ShoppingCart cart) {
        CartResponse r = new CartResponse();
        r.setId(cart.getId());
        r.setTouristId(cart.getTouristId());
        r.setTotalPrice(cart.getTotalPrice());
        r.setItems(cart.getItems().stream().map(this::toItemResponse).collect(Collectors.toList()));
        return r;
    }

    private OrderItemResponse toItemResponse(OrderItem item) {
        OrderItemResponse r = new OrderItemResponse();
        r.setId(item.getId());
        r.setTourId(item.getTourId());
        r.setTourName(item.getTourName());
        r.setPrice(item.getPrice());
        return r;
    }

    private TokenResponse toTokenResponse(TourPurchaseToken token) {
        TokenResponse r = new TokenResponse();
        r.setId(token.getId());
        r.setTouristId(token.getTouristId());
        r.setTourId(token.getTourId());
        r.setTourName(token.getTourName());
        r.setPurchasedAt(token.getPurchasedAt());
        return r;
    }

    @lombok.Data
    public static class TourStatusResponse {
        private String status;
    }
}