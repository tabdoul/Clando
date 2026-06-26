package com.example.Clando.service;

import com.example.Clando.dtos.request.AvisRequest;
import com.example.Clando.dtos.response.AvisResponse;
import com.example.Clando.entity.Avis;
import com.example.Clando.entity.Trajet;
import com.example.Clando.entity.Utilisateur;
import com.example.Clando.repository.AvisRepository;
import com.example.Clando.repository.TrajetRepository;
import com.example.Clando.repository.UtilisateurRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AvisService {

    private final AvisRepository avisRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final TrajetRepository trajetRepository;

    public AvisService(AvisRepository avisRepository,
                       UtilisateurRepository utilisateurRepository,
                       TrajetRepository trajetRepository) {
        this.avisRepository = avisRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.trajetRepository = trajetRepository;
    }

    public AvisResponse creer(AvisRequest request) {
        if (avisRepository.existsByAuteurIdAndTrajetId(
                request.getAuteurId(), request.getTrajetId())) {
            throw new IllegalStateException("Vous avez déjà laissé un avis pour ce trajet");
        }

        Utilisateur auteur = utilisateurRepository.findById(request.getAuteurId())
                .orElseThrow(() -> new EntityNotFoundException("Auteur non trouvé"));

        Utilisateur destinataire = utilisateurRepository.findById(request.getDestinataireId())
                .orElseThrow(() -> new EntityNotFoundException("Destinataire non trouvé"));

        Trajet trajet = trajetRepository.findById(request.getTrajetId())
                .orElseThrow(() -> new EntityNotFoundException("Trajet non trouvé"));

        Avis avis = Avis.builder()
                .note(request.getNote())
                .commentaire(request.getCommentaire())
                .auteur(auteur)
                .destinataire(destinataire)
                .trajet(trajet)
                .build();

        return toResponse(avisRepository.save(avis));
    }

    public List<AvisResponse> getByDestinataire(Long destinataireId) {
        return avisRepository.findByDestinataireIdOrderByDateAvisDesc(destinataireId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Double getNoteMoyenne(Long destinataireId) {
        Double moyenne = avisRepository.findNoteMoyenneByDestinataire(destinataireId);
        return moyenne != null ? Math.round(moyenne * 10.0) / 10.0 : null;
    }

    public Long getNbTrajetsTermines(Long conducteurId) {
        return avisRepository.countTrajetsTerminesByConducteur(conducteurId);
    }

    public AvisResponse toResponse(Avis a) {
        return AvisResponse.builder()
                .id(a.getId())
                .note(a.getNote())
                .commentaire(a.getCommentaire())
                .dateAvis(a.getDateAvis())
                .auteurId(a.getAuteur().getId())
                .auteurNom(a.getAuteur().getNom())
                .auteurPrenom(a.getAuteur().getPrenom())
                .destinataireId(a.getDestinataire().getId())
                .trajetId(a.getTrajet().getId())
                .build();
    }
}