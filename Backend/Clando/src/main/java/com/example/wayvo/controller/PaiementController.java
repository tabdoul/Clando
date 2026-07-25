package com.example.wayvo.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.wayvo.entity.Reservation;
import com.example.wayvo.repository.ReservationRepository;
import com.example.wayvo.repository.TrajetRepository;
import com.example.wayvo.service.DjomyService;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/paiements")
public class PaiementController {

    private final DjomyService djomyService;
    private final ReservationRepository reservationRepository;
    private final TrajetRepository trajetRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PaiementController(DjomyService djomyService,
                               ReservationRepository reservationRepository,
                               TrajetRepository trajetRepository) {
        this.djomyService = djomyService;
        this.reservationRepository = reservationRepository;
        this.trajetRepository = trajetRepository;
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
    public ResponseEntity<?> webhook(
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature,
            @RequestBody String rawBody) { // ✅ corps brut en String

        System.out.println("=== Webhook Djomy recu ===");
        System.out.println("=== Signature: " + signature);
        System.out.println("=== Body brut: " + rawBody);

        try {
            // ✅ Parse le corps brut en Map
            Map<String, Object> body = objectMapper.readValue(rawBody, Map.class);

            // ✅ Vérification HMAC sur le corps brut
            if (signature != null && signature.startsWith("v1:")) {
                String signatureRecue = signature.substring(3);
                String signatureAttendue = djomyService.generateHmac(
                    rawBody, djomyService.getClientSecret());

                System.out.println("=== Signature attendue: " + signatureAttendue);
                System.out.println("=== Signature recue: " + signatureRecue);

                if (!signatureAttendue.equals(signatureRecue)) {
                    System.out.println("=== Signature invalide — webhook rejete");
                    // En production décommente la ligne suivante pour rejeter les webhooks invalides
                    // return ResponseEntity.status(401).body(Map.of("erreur", "Signature invalide"));
                }
            }

            String eventType = (String) body.get("eventType");
            System.out.println("=== EventType: " + eventType);

            Map<String, Object> data = (Map<String, Object>) body.get("data");
            if (data == null) {
                return ResponseEntity.ok(Map.of("status", "ignored"));
            }

            String transactionId = (String) data.get("transactionId");
            String status = (String) data.get("status");

            System.out.println("=== TransactionId: " + transactionId);
            System.out.println("=== Status: " + status);

            if (transactionId == null) {
                return ResponseEntity.ok(Map.of("status", "ignored"));
            }

            List<Reservation> reservations = reservationRepository
                .findByDjomyTransactionId(transactionId);

            if (reservations.isEmpty()) {
                System.out.println("=== Reservation non trouvee");
                return ResponseEntity.ok(Map.of("status", "not_found"));
            }

            Reservation reservation = reservations.get(0);

            if ("payment.success".equals(eventType) || "SUCCESS".equals(status)) {
                reservation.setStatutPaiement("SUCCESS");
                System.out.println("=== Paiement reussi !");
            } else if ("payment.failed".equals(eventType) || "FAILED".equals(status)) {
                reservation.setStatutPaiement("FAILED");
                var trajet = reservation.getTrajet();
                trajet.setPlacesDisponibles(
                    trajet.getPlacesDisponibles() + reservation.getNbPlaces()
                );
                trajetRepository.save(trajet);
                System.out.println("=== Paiement echoue !");
            } else if ("payment.cancelled".equals(eventType) || "CANCELLED".equals(status)) {
                reservation.setStatutPaiement("CANCELLED");
                var trajet = reservation.getTrajet();
                trajet.setPlacesDisponibles(
                    trajet.getPlacesDisponibles() + reservation.getNbPlaces()
                );
                trajetRepository.save(trajet);
                System.out.println("=== Paiement annule !");
            }

            reservationRepository.save(reservation);

        } catch (Exception e) {
            System.out.println("=== Erreur webhook: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of("status", "received"));
    }
}