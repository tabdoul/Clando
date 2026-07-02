package com.example.Clando.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class EmailService {

    @Value("${brevo.api.key}")
    private String apiKey;

    @Value("${brevo.sender.email}")
    private String senderEmail;

    @Value("${brevo.sender.name}")
    private String senderName;

    private final RestTemplate restTemplate = new RestTemplate();

    public void envoyerCodeReset(String email, String code) {
        String url = "https://api.brevo.com/v3/smtp/email";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", apiKey);

        Map<String, Object> body = Map.of(
            "sender", Map.of(
                "name", senderName,
                "email", senderEmail
            ),
            "to", new Object[]{
                Map.of("email", email)
            },
            "subject", "WayVo — Réinitialisation de votre mot de passe",
            "textContent",
                "Bonjour,\n\n" +
                "Vous avez demandé la réinitialisation de votre mot de passe WayVo.\n\n" +
                "Votre code de vérification est : " + code + "\n\n" +
                "Ce code est valable 15 minutes.\n\n" +
                "Si vous n'avez pas fait cette demande, ignorez ce message.\n\n" +
                "L'équipe WayVo"
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            restTemplate.postForEntity(url, request, String.class);
        } catch (Exception e) {
            throw new RuntimeException("Erreur envoi email : " + e.getMessage());
        }
    }
}