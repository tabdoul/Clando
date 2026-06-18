package com.example.Clando.controller;

import com.example.Clando.dtos.request.ReservationRequest;
import com.example.Clando.dtos.response.ReservationResponse;
import com.example.Clando.entity.Reservation;
import com.example.Clando.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    public ResponseEntity<ReservationResponse> creer(@Valid @RequestBody ReservationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reservationService.creer(request));
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

    @GetMapping("/conducteur/{conducteurId}/en-attente")
    public ResponseEntity<List<ReservationResponse>> getEnAttenteParConducteur(
            @PathVariable Long conducteurId) {
        return ResponseEntity.ok(
                reservationService.getReservationsEnAttenteParConducteur(conducteurId));
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<ReservationResponse> changerStatut(
            @PathVariable Long id,
            @RequestParam String statut) {
        return ResponseEntity.ok(
                reservationService.changerStatut(id,
                        Reservation.StatutReservation.valueOf(statut)));
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        reservationService.supprimer(id);
        return ResponseEntity.noContent().build();
    }
    @PatchMapping("/{id}/annuler")
public ResponseEntity<?> annuler(@PathVariable Long id) {
    return ResponseEntity.ok(reservationService.annuler(id));
}
}