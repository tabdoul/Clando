package com.example.Clando.controller;

import com.example.Clando.entity.Reservation;
import com.example.Clando.repository.ReservationRepository;
import com.example.Clando.repository.TrajetRepository;
import com.example.Clando.service.DjomyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/paiements")
public class PaiementController {

    private final DjomyService djomyService;
    private final ReservationRepository reservationRepository;
    private final TrajetRepository trajetRepository;

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
            @RequestBody Map<String, Object> body) {

        System.out.println("=== Webhook Djomy reçu ===");
        System.out.println("=== Signature: " + signature);
        System.out.println("=== Body: " + body);

        try {
            // Vérifier la signature
            if (signature != null && signature.startsWith("v1:")) {
                String signatureValue = signature.substring(3);
                String expectedSignature = djomyService.generateHmac(
                    body.toString(), djomyService.getClientSecret());
                System.out.println("=== Signature attendue: " + expectedSignature);
                System.out.println("=== Signature reçue: " + signatureValue);
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
                System.out.println("=== Réservation non trouvée");
                return ResponseEntity.ok(Map.of("status", "not_found"));
            }

            Reservation reservation = reservations.get(0);

            if ("payment.success".equals(eventType) || "SUCCESS".equals(status)) {
                reservation.setStatutPaiement("SUCCESS");
                System.out.println("=== Paiement réussi !");
            } else if ("payment.failed".equals(eventType) || "FAILED".equals(status)) {
                reservation.setStatutPaiement("FAILED");
                var trajet = reservation.getTrajet();
                trajet.setPlacesDisponibles(
                    trajet.getPlacesDisponibles() + reservation.getNbPlaces()
                );
                trajetRepository.save(trajet);
                System.out.println("=== Paiement échoué !");
            } else if ("payment.cancelled".equals(eventType) || "CANCELLED".equals(status)) {
                reservation.setStatutPaiement("CANCELLED");
                var trajet = reservation.getTrajet();
                trajet.setPlacesDisponibles(
                    trajet.getPlacesDisponibles() + reservation.getNbPlaces()
                );
                trajetRepository.save(trajet);
                System.out.println("=== Paiement annulé !");
            }

            reservationRepository.save(reservation);

        } catch (Exception e) {
            System.out.println("=== Erreur webhook: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of("status", "received"));
    }
}