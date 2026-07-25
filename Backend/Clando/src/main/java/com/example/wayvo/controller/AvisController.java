package com.example.wayvo.controller;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.wayvo.dtos.request.AvisRequest;
import com.example.wayvo.dtos.response.AvisResponse;
import com.example.wayvo.entity.Trajet;
import com.example.wayvo.repository.AvisRepository;
import com.example.wayvo.repository.TrajetRepository;
import com.example.wayvo.service.AvisService;

import java.time.LocalDateTime;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/avis")
public class AvisController {

    private final AvisService avisService;
    private final TrajetRepository trajetRepository;
    private final AvisRepository avisRepository;

    public AvisController(AvisService avisService,
                      TrajetRepository trajetRepository,
                      AvisRepository avisRepository) {
    this.avisService = avisService;
    this.trajetRepository = trajetRepository;
    this.avisRepository = avisRepository;
}

    @PostMapping
    public ResponseEntity<?> creer(@Valid @RequestBody AvisRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(avisService.creer(request));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/utilisateur/{userId}")
    public ResponseEntity<List<AvisResponse>> getByDestinataire(@PathVariable Long userId) {
        return ResponseEntity.ok(avisService.getByDestinataire(userId));
    }

    @GetMapping("/utilisateur/{userId}/moyenne")
    public ResponseEntity<Map<String, Object>> getStats(@PathVariable Long userId) {
        Double moyenne = avisService.getNoteMoyenne(userId);
        Long nbTrajets = avisService.getNbTrajetsTermines(userId);
        return ResponseEntity.ok(Map.of(
                "noteMoyenne", moyenne != null ? moyenne : 0.0,
                "nbTrajets", nbTrajets != null ? nbTrajets : 0
        ));
    }
    @GetMapping("/peut-laisser-avis/{trajetId}/{userId}")
public ResponseEntity<Map<String, Object>> peutLaisserAvis(
        @PathVariable Long trajetId,
        @PathVariable Long userId) {
    try {
        Trajet trajet = trajetRepository.findById(trajetId)
                .orElseThrow(() -> new EntityNotFoundException("Trajet non trouvé"));

        LocalDateTime maintenant = LocalDateTime.now();
        LocalDateTime heureAutorisation = trajet.getDateHeureDepart().plusHours(5);
        boolean peutLaisser = maintenant.isAfter(heureAutorisation);
        boolean dejaLaisse = avisRepository.existsByAuteurIdAndTrajetId(userId, trajetId);

        return ResponseEntity.ok(Map.of(
                "peutLaisserAvis", peutLaisser && !dejaLaisse,
                "dejaLaisse", dejaLaisse,
                "heureAutorisation", heureAutorisation.toString()
        ));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
    }
}
}