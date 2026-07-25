package com.example.wayvo.service;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import com.example.wayvo.dtos.response.SignalementResponse;
import com.example.wayvo.entity.Signalement;
import com.example.wayvo.entity.Utilisateur;
import com.example.wayvo.repository.SignalementRepository;
import com.example.wayvo.repository.UtilisateurRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SignalementService {

    private final SignalementRepository signalementRepository;
    private final UtilisateurRepository utilisateurRepository;

    public SignalementService(SignalementRepository signalementRepository,
                              UtilisateurRepository utilisateurRepository) {
        this.signalementRepository = signalementRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    public SignalementResponse creer(Long utilisateurId,
                                     Signalement.TypeSignalement type,
                                     String description) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur non trouvé"));

        Signalement signalement = Signalement.builder()
                .type(type)
                .description(description)
                .utilisateur(utilisateur)
                .build();

        return toResponse(signalementRepository.save(signalement));
    }

    public List<SignalementResponse> getByUtilisateur(Long utilisateurId) {
        return signalementRepository
                .findByUtilisateurIdOrderByDateSignalementDesc(utilisateurId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<SignalementResponse> getOuverts() {
        return signalementRepository
                .findByStatutOrderByDateSignalementDesc(Signalement.StatutSignalement.OUVERT)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public SignalementResponse repondre(Long id, String reponse) {
        Signalement signalement = signalementRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Signalement non trouvé"));
        signalement.setReponseAdmin(reponse);
        signalement.setStatut(Signalement.StatutSignalement.RESOLU);
        return toResponse(signalementRepository.save(signalement));
    }

    public SignalementResponse toResponse(Signalement s) {
        return SignalementResponse.builder()
                .id(s.getId())
                .type(s.getType())
                .description(s.getDescription())
                .statut(s.getStatut())
                .dateSignalement(s.getDateSignalement())
                .reponseAdmin(s.getReponseAdmin())
                .utilisateurId(s.getUtilisateur().getId())
                .utilisateurNom(s.getUtilisateur().getNom())
                .utilisateurPrenom(s.getUtilisateur().getPrenom())
                .build();
    }
}