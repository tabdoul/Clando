package com.example.Clando.controller;

import com.example.Clando.dtos.response.SignalementResponse;
import com.example.Clando.entity.Signalement;
import com.example.Clando.service.SignalementService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/signalements")
public class SignalementController {

    private final SignalementService signalementService;

    public SignalementController(SignalementService signalementService) {
        this.signalementService = signalementService;
    }

    @PostMapping
    public ResponseEntity<SignalementResponse> creer(
            @RequestParam Long utilisateurId,
            @RequestParam Signalement.TypeSignalement type,
            @RequestParam String description) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(signalementService.creer(utilisateurId, type, description));
    }

    @GetMapping("/utilisateur/{userId}")
    public ResponseEntity<List<SignalementResponse>> getByUtilisateur(@PathVariable Long userId) {
        return ResponseEntity.ok(signalementService.getByUtilisateur(userId));
    }

    @GetMapping("/ouverts")
    public ResponseEntity<List<SignalementResponse>> getOuverts() {
        return ResponseEntity.ok(signalementService.getOuverts());
    }

    @PatchMapping("/{id}/repondre")
    public ResponseEntity<SignalementResponse> repondre(
            @PathVariable Long id,
            @RequestParam String reponse) {
        return ResponseEntity.ok(signalementService.repondre(id, reponse));
    }
}