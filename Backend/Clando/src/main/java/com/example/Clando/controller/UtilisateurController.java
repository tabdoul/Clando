package com.example.Clando.controller;

import com.example.Clando.dtos.request.UtilisateurRequest;
import com.example.Clando.dtos.response.UtilisateurResponse;
import com.example.Clando.entity.Utilisateur;
import com.example.Clando.repository.UtilisateurRepository;
import com.example.Clando.service.UtilisateurService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/utilisateurs")
public class UtilisateurController {

    private final UtilisateurService utilisateurService;
    private final UtilisateurRepository utilisateurRepository;

    public UtilisateurController(UtilisateurService utilisateurService,
                                  UtilisateurRepository utilisateurRepository) {
        this.utilisateurService = utilisateurService;
        this.utilisateurRepository = utilisateurRepository;
    }

    @PostMapping
    public ResponseEntity<UtilisateurResponse> creer(@Valid @RequestBody UtilisateurRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(utilisateurService.creer(request));
    }

    @GetMapping
    public ResponseEntity<List<UtilisateurResponse>> getAll() {
        return ResponseEntity.ok(utilisateurService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UtilisateurResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(utilisateurService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UtilisateurResponse> modifier(@PathVariable Long id,
                                                         @Valid @RequestBody UtilisateurRequest request) {
        return ResponseEntity.ok(utilisateurService.modifier(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        utilisateurService.supprimer(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/photo")
    public ResponseEntity<?> uploadPhoto(
            @PathVariable Long id,
            @RequestParam("fichier") MultipartFile fichier) {
        try {
            String uploadDir = "uploads/photos";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String extension = fichier.getOriginalFilename()
                    .substring(fichier.getOriginalFilename().lastIndexOf('.'));
            String nomFichier = "user_" + id + extension;
            Path cheminFichier = uploadPath.resolve(nomFichier);
            Files.copy(fichier.getInputStream(), cheminFichier,
                    java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            Utilisateur utilisateur = utilisateurService.findById(id);
            utilisateur.setPhoto(cheminFichier.toString());
            utilisateurRepository.save(utilisateur);

            return ResponseEntity.ok(Map.of("photo", cheminFichier.toString()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}