package com.example.Clando.controller;

import com.example.Clando.service.DjomyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/paiements")
public class PaiementController {

    private final DjomyService djomyService;

    public PaiementController(DjomyService djomyService) {
        this.djomyService = djomyService;
    }

    @PostMapping("/initier")
    public ResponseEntity<?> initierPaiement(@RequestBody Map<String, Object> body) {
        try {
            String telephone = (String) body.get("telephone");
            double montant = Double.parseDouble(body.get("montant").toString());
            String reference = (String) body.get("reference");
            String description = (String) body.get("description");

            Map<String, Object> result = djomyService.initierPaiement(
                telephone, montant, reference, description);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/statut/{transactionId}")
    public ResponseEntity<?> verifierStatut(@PathVariable String transactionId) {
        try {
            return ResponseEntity.ok(djomyService.verifierStatutPaiement(transactionId));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> webhook(@RequestBody Map<String, Object> body) {
        System.out.println("Webhook Djomy reçu: " + body);
        // On traitera la logique ici après
        return ResponseEntity.ok(Map.of("status", "received"));
    }
}