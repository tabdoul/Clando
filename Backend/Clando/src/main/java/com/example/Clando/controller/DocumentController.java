package com.example.Clando.controller;

import com.example.Clando.dtos.response.DocumentResponse;
import com.example.Clando.entity.Document;
import com.example.Clando.service.DocumentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
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