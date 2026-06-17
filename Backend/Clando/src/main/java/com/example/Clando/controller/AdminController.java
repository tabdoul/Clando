package com.example.Clando.controller;

import com.example.Clando.dtos.response.DocumentResponse;
import com.example.Clando.dtos.response.SignalementResponse;
import com.example.Clando.dtos.response.UtilisateurResponse;
import com.example.Clando.entity.Signalement;
import com.example.Clando.repository.*;
import com.example.Clando.service.DocumentService;
import com.example.Clando.service.SignalementService;
import com.example.Clando.service.UtilisateurService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UtilisateurRepository utilisateurRepository;
    private final TrajetRepository trajetRepository;
    private final ReservationRepository reservationRepository;
    private final DocumentService documentService;
    private final SignalementService signalementService;
    private final UtilisateurService utilisateurService;
    private final SignalementRepository signalementRepository;
    private final DocumentRepository documentRepository;

    public AdminController(UtilisateurRepository utilisateurRepository,
                           TrajetRepository trajetRepository,
                           ReservationRepository reservationRepository,
                           DocumentService documentService,
                           SignalementService signalementService,
                           UtilisateurService utilisateurService,
                           SignalementRepository signalementRepository,
                           DocumentRepository documentRepository) {
        this.utilisateurRepository = utilisateurRepository;
        this.trajetRepository = trajetRepository;
        this.reservationRepository = reservationRepository;
        this.documentService = documentService;
        this.signalementService = signalementService;
        this.utilisateurService = utilisateurService;
        this.signalementRepository = signalementRepository;
        this.documentRepository = documentRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(Map.of(
            "nbUtilisateurs", utilisateurRepository.count(),
            "nbTrajets", trajetRepository.count(),
            "nbReservations", reservationRepository.count(),
            "nbDocumentsEnAttente", documentRepository.findByStatut(
                com.example.Clando.entity.Document.StatutDocument.EN_ATTENTE).size(),
            "nbSignalementsOuverts", signalementRepository.countByStatut(
                Signalement.StatutSignalement.OUVERT)
        ));
    }

    @GetMapping("/utilisateurs")
    public ResponseEntity<List<UtilisateurResponse>> getUtilisateurs() {
        return ResponseEntity.ok(utilisateurService.getAll());
    }

    @GetMapping("/documents")
    public ResponseEntity<List<DocumentResponse>> getDocumentsEnAttente() {
        return ResponseEntity.ok(documentService.getEnAttente());
    }

    @PatchMapping("/documents/{id}/valider")
    public ResponseEntity<DocumentResponse> validerDocument(
            @PathVariable Long id,
            @RequestParam boolean accepte,
            @RequestParam(required = false) String commentaire) {
        return ResponseEntity.ok(documentService.valider(id, accepte, commentaire));
    }

    @GetMapping("/signalements")
    public ResponseEntity<List<SignalementResponse>> getSignalements() {
        return ResponseEntity.ok(signalementService.getOuverts());
    }

    @PatchMapping("/signalements/{id}/repondre")
    public ResponseEntity<SignalementResponse> repondreSignalement(
            @PathVariable Long id,
            @RequestParam String reponse) {
        return ResponseEntity.ok(signalementService.repondre(id, reponse));
    }
}