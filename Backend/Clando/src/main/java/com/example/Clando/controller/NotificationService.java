package com.example.Clando.service;

import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String EXPO_URL = "https://exp.host/--/api/v2/push/send";

    public void envoyerNotification(String expoPushToken, String titre, String message) {
        if (expoPushToken == null || expoPushToken.isBlank()) return;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
            "to", expoPushToken,
            "title", titre,
            "body", message,
            "sound", "default"
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            restTemplate.exchange(EXPO_URL, HttpMethod.POST, request, Map.class);
            System.out.println("=== Notification envoyée à: " + expoPushToken);
        } catch (Exception e) {
            System.out.println("=== Erreur notification: " + e.getMessage());
        }
    }

    public void envoyerNotifications(List<String> tokens, String titre, String message) {
        tokens.forEach(token -> envoyerNotification(token, titre, message));
    }
}