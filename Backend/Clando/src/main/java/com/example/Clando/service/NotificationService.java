package com.example.Clando.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public void envoyerNotification(String expoPushToken, String titre, String message) {
        if (expoPushToken == null || expoPushToken.isBlank()) {
            log.warn("Token push manquant, notification non envoyee");
            return;
        }

        try {
            Map<String, Object> body = Map.of(
                "to", expoPushToken,
                "title", titre,
                "body", message,
                "sound", "default",
                "priority", "high"
            );

            String json = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(EXPO_PUSH_URL))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            log.info("Notification envoyee a {} — status: {}", expoPushToken, response.statusCode());

        } catch (Exception e) {
            log.error("Erreur envoi notification: {}", e.getMessage());
        }
    }

    public void envoyerNotifications(List<String> tokens, String titre, String message) {
        tokens.forEach(token -> envoyerNotification(token, titre, message));
    }
}