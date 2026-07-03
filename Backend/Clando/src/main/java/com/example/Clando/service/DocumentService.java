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
    private final NotificationService notificationService; // ✅ ajouté

    public DocumentService(DocumentRepository documentRepository,
                           UtilisateurRepository utilisateurRepository,
                           CloudinaryService cloudinaryService,
                           NotificationService notificationService) { // ✅ ajouté
        this.documentRepository = documentRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.cloudinaryService = cloudinaryService;
        this.notificationService = notificationService; // ✅ ajouté
    }

    public DocumentResponse uploader(Long utilisateurId,
                                     Document.TypeDocument type,
                                     MultipartFile fichier) throws IOException {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur non trouvé"));

        documentRepository.findByUtilisateurId(utilisateurId).stream()
                .filter(d -> d.getType() == type)
                .forEach(d -> documentRepository.delete(d));

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

        Utilisateur utilisateur = document.getUtilisateur();
        String token = utilisateur.getExpoPushToken();
        String typeDoc = document.getType().toString();

        // ✅ Notification selon le statut
        if (token != null && !token.isBlank()) {
            if (accepte) {
                notificationService.envoyerNotification(
                    token,
                    "Document validé ✅",
                    "Votre " + formatTypeDocument(typeDoc) + " a été vérifié et validé par l'équipe WayVo."
                );
            } else {
                String motif = (commentaire != null && !commentaire.isBlank())
                    ? " Motif : " + commentaire
                    : "";
                notificationService.envoyerNotification(
                    token,
                    "Document rejeté ❌",
                    "Votre " + formatTypeDocument(typeDoc) + " n'a pas été accepté." + motif
                );
            }
        }

        if (accepte) {
            List<Document> docs = documentRepository.findByUtilisateurId(utilisateur.getId());
            boolean tousValides = docs.stream()
                    .allMatch(d -> d.getStatut() == Document.StatutDocument.VALIDE);
            if (tousValides && docs.size() >= 1) {
                utilisateur.setVerifie(true);
                utilisateurRepository.save(utilisateur);

                if (token != null && !token.isBlank()) {
                    notificationService.envoyerNotification(
                        token,
                        "Compte vérifié 🎉",
                        "Félicitations ! Votre compte Wayvo est maintenant vérifié. Vous pouvez publier des trajets."
                    );
                }
            }
        }

        return toResponse(documentRepository.save(document));
    }

    private String formatTypeDocument(String type) {
        return switch (type) {
            case "CNI" -> "Carte Nationale d'Identité";
            case "PASSEPORT" -> "Passeport";
            case "PERMIS_CONDUIRE" -> "Permis de conduire";
            case "CERTIFICAT_IMMATRICULATION" -> "Certificat d'immatriculation";
            default -> "document";
        };
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