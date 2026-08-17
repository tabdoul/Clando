package com.example.wayvo.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.wayvo.service.DjomyWebhookService;

@RestController
@RequestMapping("/api/webhooks")
public class WebhookController {

    private final DjomyWebhookService djomyWebhookService;

    public WebhookController(DjomyWebhookService djomyWebhookService) {
        this.djomyWebhookService = djomyWebhookService;
    }

    @PostMapping("/djomy")
    public ResponseEntity<?> recevoirWebhookDjomy(
            @RequestBody String payload,
            @RequestHeader("X-Webhook-Signature") String signature) {
        try {
            boolean valide = djomyWebhookService.traiterWebhook(payload, signature);
            if (!valide) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Signature invalide");
            }
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur : " + e.getMessage());
        }
    }
}