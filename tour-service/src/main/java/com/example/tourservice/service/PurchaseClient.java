package com.example.tourservice.service;

import com.example.tourservice.dto.ExecutionDtos.PurchaseOwnershipResponse;
import com.example.tourservice.exception.PurchaseServiceUnavailableException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class PurchaseClient {

    private final RestClient restClient;

    public PurchaseClient(@Value("${purchase.service.base-url}") String purchaseServiceBaseUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(purchaseServiceBaseUrl)
                .build();
    }

    public boolean hasPurchasedTour(Long touristId, Long tourId) {
        try {
            PurchaseOwnershipResponse response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/purchases/ownership")
                            .queryParam("touristId", touristId)
                            .queryParam("tourId", tourId)
                            .build())
                    .retrieve()
                    .body(PurchaseOwnershipResponse.class);
            return response != null && response.isPurchased();
        } catch (HttpClientErrorException.NotFound ex) {
            return false;
        } catch (RestClientException ex) {
            throw new PurchaseServiceUnavailableException(
                    "Purchase service is unavailable. Tour ownership could not be verified."
            );
        }
    }
}
