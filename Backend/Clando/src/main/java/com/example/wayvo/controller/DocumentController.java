package com.example.wayvo.controller;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.wayvo.dtos.response.DocumentResponse;
import com.example.wayvo.entity.Document;
import com.example.wayvo.repository.DocumentRepository;
import com.example.wayvo.service.DocumentService;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;
    private final DocumentRepository documentRepository;

    public DocumentController(DocumentService documentService,
                               DocumentRepository documentRepository) {
        this.documentService = documentService;
        this.documentRepository = documentRepository;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploader(
            @RequestParam("utilisateurId") Long utilisateurId,
            @RequestParam("type") Document.TypeDocument type,
            @RequestParam("fichier") MultipartFile fichier) {
        try {
            return ResponseEntity.ok(documentService.uploader(utilisateurId, type, fichier));
        } catch (IOException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erreur", "Erreur lors de l'upload"));
        }
    }

    @GetMapping("/utilisateur/{userId}")
    public ResponseEntity<List<DocumentResponse>> getByUtilisateur(@PathVariable Long userId) {
        return ResponseEntity.ok(documentService.getByUtilisateur(userId));
    }

    @GetMapping("/en-attente")
    public ResponseEntity<List<DocumentResponse>> getEnAttente() {
        return ResponseEntity.ok(documentService.getEnAttente());
    }

    @GetMapping("/fichier/{id}")
    public ResponseEntity<Resource> servirFichier(@PathVariable Long id) {
        try {
            Document document = documentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Document non trouvé"));

            Path filePath = Paths.get(document.getCheminFichier());
            Resource resource = new FileSystemResource(filePath);

            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/valider")
    public ResponseEntity<?> valider(
            @PathVariable Long id,
            @RequestParam boolean accepte,
            @RequestParam(required = false) String commentaire) {
        try {
            return ResponseEntity.ok(documentService.valider(id, accepte, commentaire));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erreur", e.getMessage()));
        }
    }
}