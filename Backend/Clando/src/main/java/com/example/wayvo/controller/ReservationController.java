package com.example.wayvo.controller;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.wayvo.dtos.request.ReservationRequest;
import com.example.wayvo.dtos.response.ReservationResponse;
import com.example.wayvo.entity.Reservation;
import com.example.wayvo.service.ReservationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    public ResponseEntity<?> creer(@Valid @RequestBody ReservationRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(reservationService.creer(request));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erreur", e.getMessage()));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReservationResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(reservationService.getById(id));
    }

    @GetMapping("/passager/{passagerId}")
    public ResponseEntity<List<ReservationResponse>> getByPassager(@PathVariable Long passagerId) {
        return ResponseEntity.ok(reservationService.getByPassager(passagerId));
    }

    @GetMapping("/trajet/{trajetId}")
    public ResponseEntity<List<ReservationResponse>> getByTrajet(@PathVariable Long trajetId) {
        return ResponseEntity.ok(reservationService.getByTrajet(trajetId));
    }

    @GetMapping("/trajet/{trajetId}/passagers")
    public ResponseEntity<List<ReservationResponse>> getPassagersConfirmes(
            @PathVariable Long trajetId) {
        return ResponseEntity.ok(reservationService.getPassagersConfirmes(trajetId));
    }

    @GetMapping("/conducteur/{conducteurId}/en-attente")
    public ResponseEntity<List<ReservationResponse>> getEnAttenteParConducteur(
            @PathVariable Long conducteurId) {
        return ResponseEntity.ok(
                reservationService.getReservationsEnAttenteParConducteur(conducteurId));
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<?> changerStatut(
            @PathVariable Long id,
            @RequestParam String statut) {
        try {
            return ResponseEntity.ok(
                    reservationService.changerStatut(id,
                            Reservation.StatutReservation.valueOf(statut)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erreur", "Statut invalide : " + statut));
        }
    }

    @PatchMapping("/{id}/negociation")
    public ResponseEntity<?> repondreNegociation(
            @PathVariable Long id,
            @RequestParam boolean accepter,
            @RequestParam(required = false) Double prixConducteur) {
        try {
            return ResponseEntity.ok(
                reservationService.repondreNegociation(id, accepter, prixConducteur)
            );
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/nouvelle-proposition")
    public ResponseEntity<?> nouvelleProposition(
            @PathVariable Long id,
            @RequestParam Double nouveauPrix) {
        try {
            return ResponseEntity.ok(reservationService.nouvelleProposition(id, nouveauPrix));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/annuler")
    public ResponseEntity<?> annuler(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(reservationService.annuler(id));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erreur", e.getMessage()));
        }
    }

    // Simuler paiement à retirer avant mise en prod
    @PostMapping("/{id}/payer-test")
public ResponseEntity<?> simulerPaiement(@PathVariable Long id) {
    try {
        return ResponseEntity.ok(reservationService.simulerPaiement(id));
    } catch (Exception e) {
        return ResponseEntity.badRequest()
                .body(Map.of("erreur", e.getMessage()));
    }
}

@GetMapping("/conducteur/{conducteurId}/confirmees")
public ResponseEntity<List<ReservationResponse>> getConfirmeesParConducteur(
        @PathVariable Long conducteurId) {
    return ResponseEntity.ok(
        reservationService.getReservationsConfirmeesParConducteur(conducteurId)
    );
}

    @PostMapping("/{id}/payer")
    public ResponseEntity<?> initierPaiement(
            @PathVariable Long id,
            @RequestParam String numeroTelephone) {
        try {
            return ResponseEntity.ok(reservationService.initierPaiement(id, numeroTelephone));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/confirmer-trajet")
    public ResponseEntity<?> confirmerTrajet(
            @PathVariable Long id,
            @RequestParam Long passagerId) {
        try {
            return ResponseEntity.ok(
                reservationService.confirmerTrajetParPassager(id, passagerId)
            );
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erreur", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        reservationService.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}