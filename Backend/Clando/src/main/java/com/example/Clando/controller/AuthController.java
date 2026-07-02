package com.example.Clando.controller;

import com.example.Clando.service.UtilisateurService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UtilisateurService utilisateurService;

    public AuthController(UtilisateurService utilisateurService) {
        this.utilisateurService = utilisateurService;
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        try {
            utilisateurService.demanderResetPassword(body.get("email"));
            return ResponseEntity.ok(Map.of(
                "message", "Un code de vérification a été envoyé à votre adresse email"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/verify-reset-code")
    public ResponseEntity<?> verifyCode(@RequestBody Map<String, String> body) {
        try {
            utilisateurService.verifierCode(body.get("email"), body.get("code"));
            return ResponseEntity.ok(Map.of("valide", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        try {
            utilisateurService.resetPassword(
                body.get("email"),
                body.get("code"),
                body.get("nouveauMotDePasse")
            );
            return ResponseEntity.ok(Map.of(
                "message", "Mot de passe modifié avec succès"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}