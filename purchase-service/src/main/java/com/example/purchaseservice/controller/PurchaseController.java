package com.example.purchaseservice.controller;

import com.example.purchaseservice.dto.PurchaseDtos.*;
import com.example.purchaseservice.service.PurchaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchase")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PurchaseController {

    private final PurchaseService purchaseService;


    @GetMapping("/cart/{touristId}")
    public ResponseEntity<CartResponse> getCart(@PathVariable Long touristId) {
        return ResponseEntity.ok(purchaseService.getCart(touristId));
    }

    @PostMapping("/cart/add")
    public ResponseEntity<CartResponse> addToCart(@Valid @RequestBody AddToCartRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(purchaseService.addToCart(req));
    }

    @DeleteMapping("/cart/{touristId}/items/{tourId}")
    public ResponseEntity<CartResponse> removeFromCart(@PathVariable Long touristId,
                                                        @PathVariable Long tourId) {
        return ResponseEntity.ok(purchaseService.removeFromCart(touristId, tourId));
    }


    @PostMapping("/checkout/{touristId}")
    public ResponseEntity<CheckoutResponse> checkout(@PathVariable Long touristId) {
        return ResponseEntity.ok(purchaseService.checkout(touristId));
    }


    @GetMapping("/check")
    public ResponseEntity<PurchaseCheckResponse> checkPurchase(
            @RequestParam Long touristId,
            @RequestParam Long tourId) {
        return ResponseEntity.ok(purchaseService.checkPurchase(touristId, tourId));
    }

    @GetMapping("/tokens/{touristId}")
    public ResponseEntity<List<TokenResponse>> getTokens(@PathVariable Long touristId) {
        return ResponseEntity.ok(purchaseService.getTokensForTourist(touristId));
    }
}
