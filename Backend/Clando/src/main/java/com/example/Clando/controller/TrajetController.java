package com.example.Clando.controller;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.Clando.dtos.request.TrajetRequest;
import com.example.Clando.dtos.response.TrajetResponse;
import com.example.Clando.entity.Trajet;
import com.example.Clando.service.TrajetService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/trajets")
public class TrajetController {

    private final TrajetService trajetService;

    public TrajetController(TrajetService trajetService) {
        this.trajetService = trajetService;
    }

    @PostMapping
    public ResponseEntity<?> creer(@Valid @RequestBody TrajetRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(trajetService.creer(request));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<TrajetResponse>> getAll() {
        return ResponseEntity.ok(trajetService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TrajetResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(trajetService.getById(id));
    }

    @GetMapping("/rechercher")
    public ResponseEntity<Page<TrajetResponse>> rechercher(
            @RequestParam String villeDepart,
            @RequestParam String villeArrivee,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("dateHeureDepart").ascending());
        return ResponseEntity.ok(trajetService.rechercher(villeDepart, villeArrivee, pageable));
    }

    @GetMapping("/conducteur/{conducteurId}")
    public ResponseEntity<List<TrajetResponse>> getByConducteur(@PathVariable Long conducteurId) {
        return ResponseEntity.ok(trajetService.getByConducteur(conducteurId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TrajetResponse> modifier(@PathVariable Long id,
                                                    @Valid @RequestBody TrajetRequest request) {
        return ResponseEntity.ok(trajetService.modifier(id, request));
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<?> changerStatut(@PathVariable Long id,
                                           @RequestParam String statut) {
        try {
            return ResponseEntity.ok(
                    trajetService.changerStatut(id, Trajet.StatutTrajet.valueOf(statut)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erreur", "Statut invalide : " + statut));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        trajetService.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}