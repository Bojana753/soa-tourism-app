package com.soatourism.blog.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;

@Component
public class FollowerClient {

    private final RestTemplate restTemplate;
    private final String followerServiceUrl;

    public FollowerClient(
            RestTemplate restTemplate,
            @Value("${follower.service.url}") String followerServiceUrl) {
        this.restTemplate = restTemplate;
        this.followerServiceUrl = followerServiceUrl;
    }

    public boolean isFollowing(String followerId, String targetId) {
        try {
            String url = followerServiceUrl + "/following";
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("X-User-Id", followerId);
            org.springframework.http.HttpEntity<Void> entity = new org.springframework.http.HttpEntity<>(headers);

            org.springframework.http.ResponseEntity<String[]> response = restTemplate.exchange(
                    url,
                    org.springframework.http.HttpMethod.GET,
                    entity,
                    String[].class
            );

            if (response.getBody() == null) return false;
            List<String> following = Arrays.asList(response.getBody());
            return following.contains(targetId);
        } catch (Exception e) {
            return false;
        }
    }
}
