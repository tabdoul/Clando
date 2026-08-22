package com.example.wayvo.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.example.wayvo.service.DjomyWebhookService;

@RestController
@RequestMapping("/api/webhooks")
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);

    private final DjomyWebhookService djomyWebhookService;

    public WebhookController(DjomyWebhookService djomyWebhookService) {
        this.djomyWebhookService = djomyWebhookService;
    }

    @PostMapping("/djomy")
    public ResponseEntity<?> recevoirWebhookDjomy(
            @RequestBody String payload,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature,
            @RequestHeader Map<String, String> tousLesHeaders) {
        try {
            //  Log temporaire de diagnostic — confirme le nom exact du header de signature utilise par Djomy
            log.info("Webhook Djomy - tous les headers recus : {}", tousLesHeaders);

            boolean valide = djomyWebhookService.traiterWebhook(payload, signature);
            if (!valide) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Signature invalide");
            }
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Erreur traitement webhook Djomy : {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur : " + e.getMessage());
        }
    }
}