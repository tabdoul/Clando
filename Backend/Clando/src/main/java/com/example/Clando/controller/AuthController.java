package com.example.Clando.controller;

import com.example.Clando.entity.Utilisateur;
import com.example.Clando.repository.UtilisateurRepository;
import com.example.Clando.security.JwtService;
import com.example.Clando.service.UtilisateurService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UtilisateurService utilisateurService;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthController(UtilisateurService utilisateurService,
                          UtilisateurRepository utilisateurRepository,
                          PasswordEncoder passwordEncoder,
                          AuthenticationManager authenticationManager,
                          JwtService jwtService) {
        this.utilisateurService = utilisateurService;
        this.utilisateurRepository = utilisateurRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String motDePasse = body.get("motDePasse");

            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, motDePasse)
            );

            // ✅ Génère le JWT
            String token = jwtService.genererToken(email);

            Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

            return ResponseEntity.ok(Map.of(
                "token", token,
                "userId", utilisateur.getId(),
                "nom", utilisateur.getNom(),
                "prenom", utilisateur.getPrenom(),
                "email", utilisateur.getEmail()
            ));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(401).body(Map.of("erreur", "Email ou mot de passe incorrect"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("erreur", e.getMessage()));
        }
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

    // ✅ Reset password
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        try {
            utilisateurService.resetPassword(
                body.get("email"),
                body.get("code"),
                body.get("nouveauMotDePasse")
            );
            return ResponseEntity.ok(Map.of("message", "Mot de passe modifié avec succès"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}