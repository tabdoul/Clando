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
    public ResponseEntity<?> webhook(@RequestBody Map<String, Object> body) {
        System.out.println("=== Webhook Djomy reçu: " + body);

        try {
            Map<String, Object> data = (Map<String, Object>) body.get("data");
            if (data == null) {
                return ResponseEntity.ok(Map.of("status", "ignored"));
            }

            String transactionId = (String) data.get("transactionId");
            String status = (String) data.get("status");
            String merchantReference = (String) data.get("merchantPaymentReference");

            System.out.println("=== TransactionId: " + transactionId);
            System.out.println("=== Status: " + status);
            System.out.println("=== Reference: " + merchantReference);

            if (transactionId == null) {
                return ResponseEntity.ok(Map.of("status", "ignored"));
            }

            // Trouver la réservation par transactionId
            List<Reservation> reservations = reservationRepository
                .findByDjomyTransactionId(transactionId);

            if (reservations.isEmpty()) {
                System.out.println("=== Réservation non trouvée pour transactionId: " + transactionId);
                return ResponseEntity.ok(Map.of("status", "not_found"));
            }

            Reservation reservation = reservations.get(0);

            if ("SUCCESS".equals(status) || "COMPLETED".equals(status)) {
                reservation.setStatutPaiement("SUCCESS");
                System.out.println("=== Paiement réussi pour réservation: " + reservation.getId());
            } else if ("FAILED".equals(status) || "CANCELLED".equals(status)) {
                reservation.setStatutPaiement("FAILED");
                // Restituer les places
                var trajet = reservation.getTrajet();
                trajet.setPlacesDisponibles(
                    trajet.getPlacesDisponibles() + reservation.getNbPlaces()
                );
                trajetRepository.save(trajet);
                System.out.println("=== Paiement échoué pour réservation: " + reservation.getId());
            }

            reservationRepository.save(reservation);

        } catch (Exception e) {
            System.out.println("=== Erreur webhook: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of("status", "received"));
    }
}