package com.example.Clando.service;

import com.example.Clando.dtos.response.DocumentResponse;
import com.example.Clando.entity.Document;
import com.example.Clando.entity.Utilisateur;
import com.example.Clando.repository.DocumentRepository;
import com.example.Clando.repository.UtilisateurRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final CloudinaryService cloudinaryService;

    public DocumentService(DocumentRepository documentRepository,
                           UtilisateurRepository utilisateurRepository,
                           CloudinaryService cloudinaryService) {
        this.documentRepository = documentRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.cloudinaryService = cloudinaryService;
    }

    public DocumentResponse uploader(Long utilisateurId,
                                     Document.TypeDocument type,
                                     MultipartFile fichier) throws IOException {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur non trouvé"));

        // Supprimer l'ancien document du même type si existe
        documentRepository.findByUtilisateurId(utilisateurId).stream()
                .filter(d -> d.getType() == type)
                .forEach(d -> documentRepository.delete(d));

        // Upload vers Cloudinary
        String url = cloudinaryService.uploadImage(fichier, "documents");

        Document document = Document.builder()
                .type(type)
                .cheminFichier(url)
                .utilisateur(utilisateur)
                .build();

        return toResponse(documentRepository.save(document));
    }

    public List<DocumentResponse> getByUtilisateur(Long utilisateurId) {
        return documentRepository.findByUtilisateurId(utilisateurId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<DocumentResponse> getEnAttente() {
        return documentRepository.findByStatut(Document.StatutDocument.EN_ATTENTE)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public DocumentResponse valider(Long documentId, boolean accepte, String commentaire) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document non trouvé"));

        document.setStatut(accepte
                ? Document.StatutDocument.VALIDE
                : Document.StatutDocument.REJETE);
        document.setCommentaireAdmin(commentaire);

        if (accepte) {
            Long utilisateurId = document.getUtilisateur().getId();
            List<Document> docs = documentRepository.findByUtilisateurId(utilisateurId);
            boolean tousValides = docs.stream()
                    .allMatch(d -> d.getStatut() == Document.StatutDocument.VALIDE);
            if (tousValides && docs.size() >= 1) {
                Utilisateur utilisateur = document.getUtilisateur();
                utilisateur.setVerifie(true);
                utilisateurRepository.save(utilisateur);
            }
        }

        return toResponse(documentRepository.save(document));
    }

    public DocumentResponse toResponse(Document d) {
        return DocumentResponse.builder()
                .id(d.getId())
                .type(d.getType())
                .statut(d.getStatut())
                .dateUpload(d.getDateUpload())
                .commentaireAdmin(d.getCommentaireAdmin())
                .utilisateurId(d.getUtilisateur().getId())
                .cheminFichier(d.getCheminFichier())
                .utilisateurNom(d.getUtilisateur().getNom())
                .utilisateurPrenom(d.getUtilisateur().getPrenom())
                .build();
    }
}