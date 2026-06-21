package com.example.Clando.controller;

import com.example.Clando.dtos.request.ReservationRequest;
import com.example.Clando.dtos.response.ReservationResponse;
import com.example.Clando.entity.Reservation;
import com.example.Clando.service.ReservationService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    // ✅ Catch propre : retourne {"erreur": "..."} lisible par le mobile
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

    // ✅ NOUVEAU — passagers confirmés visibles par conducteur et passagers confirmés
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
    public ResponseEntity<ReservationResponse> repondreNegociation(
            @PathVariable Long id,
            @RequestParam boolean accepter) {
        return ResponseEntity.ok(reservationService.repondreNegociation(id, accepter));
    }

    @PatchMapping("/{id}/nouvelle-proposition")
    public ResponseEntity<ReservationResponse> nouvelleProposition(
            @PathVariable Long id,
            @RequestParam Double nouveauPrix) {
        return ResponseEntity.ok(reservationService.nouvelleProposition(id, nouveauPrix));
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        reservationService.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}