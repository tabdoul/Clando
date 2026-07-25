package com.example.wayvo.service;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import com.example.wayvo.dtos.request.VehiculeRequest;
import com.example.wayvo.dtos.response.VehiculeResponse;
import com.example.wayvo.entity.Utilisateur;
import com.example.wayvo.entity.Vehicule;
import com.example.wayvo.repository.VehiculeRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class VehiculeService {

    private final VehiculeRepository vehiculeRepository;
    private final UtilisateurService utilisateurService;

    public VehiculeService(VehiculeRepository vehiculeRepository,
                           UtilisateurService utilisateurService) {
        this.vehiculeRepository = vehiculeRepository;
        this.utilisateurService = utilisateurService;
    }

    public VehiculeResponse creer(VehiculeRequest request) {
        if (vehiculeRepository.existsByImmatriculation(request.getImmatriculation())) {
            throw new RuntimeException("Immatriculation déjà enregistrée");
        }
        Utilisateur conducteur = utilisateurService.findById(request.getConducteurId());
        Vehicule vehicule = Vehicule.builder()
                .marque(request.getMarque())
                .modele(request.getModele())
                .immatriculation(request.getImmatriculation())
                .nbPlaces(request.getNbPlaces())
                .conducteur(conducteur)
                .build();
        return toResponse(vehiculeRepository.save(vehicule));
    }

    public VehiculeResponse getById(Long id) {
        return toResponse(findById(id));
    }

    public List<VehiculeResponse> getAll() {
        return vehiculeRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<VehiculeResponse> getByConducteur(Long conducteurId) {
        return vehiculeRepository.findByConducteurId(conducteurId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public VehiculeResponse modifier(Long id, VehiculeRequest request) {
        Vehicule vehicule = findById(id);
        vehicule.setMarque(request.getMarque());
        vehicule.setModele(request.getModele());
        vehicule.setImmatriculation(request.getImmatriculation());
        vehicule.setNbPlaces(request.getNbPlaces());
        return toResponse(vehiculeRepository.save(vehicule));
    }

    public void supprimer(Long id) {
        vehiculeRepository.deleteById(id);
    }

    public Vehicule findById(Long id) {
        return vehiculeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Véhicule non trouvé avec l'id : " + id));
    }

    public VehiculeResponse toResponse(Vehicule v) {
        return VehiculeResponse.builder()
                .id(v.getId())
                .marque(v.getMarque())
                .modele(v.getModele())
                .immatriculation(v.getImmatriculation())
                .nbPlaces(v.getNbPlaces())
                .conducteurId(v.getConducteur().getId())
                .conducteurNom(v.getConducteur().getNom())
                .conducteurPrenom(v.getConducteur().getPrenom())
                .build();
    }
}