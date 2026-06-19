package com.example.Clando.service;

import com.example.Clando.dtos.request.UtilisateurRequest;
import com.example.Clando.dtos.response.UtilisateurResponse;
import com.example.Clando.entity.Utilisateur;
import com.example.Clando.repository.UtilisateurRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final CloudinaryService cloudinaryService;

    public UtilisateurService(UtilisateurRepository utilisateurRepository,
                               PasswordEncoder passwordEncoder,
                               CloudinaryService cloudinaryService) {
        this.utilisateurRepository = utilisateurRepository;
        this.passwordEncoder = passwordEncoder;
        this.cloudinaryService = cloudinaryService;
    }

    public UtilisateurResponse creer(UtilisateurRequest request) {
        if (utilisateurRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email déjà utilisé");
        }
        Utilisateur utilisateur = Utilisateur.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .email(request.getEmail())
                .motDePasse(passwordEncoder.encode(request.getMotDePasse()))
                .telephone(request.getTelephone())
                .build();
        return toResponse(utilisateurRepository.save(utilisateur));
    }

    public UtilisateurResponse getById(Long id) {
        return toResponse(findById(id));
    }

    public List<UtilisateurResponse> getAll() {
        return utilisateurRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public UtilisateurResponse modifier(Long id, UtilisateurRequest request) {
        Utilisateur utilisateur = findById(id);
        utilisateur.setNom(request.getNom());
        utilisateur.setPrenom(request.getPrenom());
        utilisateur.setEmail(request.getEmail());
        utilisateur.setTelephone(request.getTelephone());
        utilisateur.setMiniBio(request.getMiniBio());
        if (request.getMotDePasse() != null && !request.getMotDePasse().isBlank()) {
            utilisateur.setMotDePasse(passwordEncoder.encode(request.getMotDePasse()));
        }
        return toResponse(utilisateurRepository.save(utilisateur));
    }

    public UtilisateurResponse uploadPhoto(Long id, MultipartFile fichier) throws IOException {
        Utilisateur utilisateur = findById(id);
        String url = cloudinaryService.uploadImage(fichier, "photos");
        utilisateur.setPhoto(url);
        return toResponse(utilisateurRepository.save(utilisateur));
    }

    public void savePushToken(Long id, String token) {
        Utilisateur utilisateur = findById(id);
        utilisateur.setExpoPushToken(token);
        utilisateurRepository.save(utilisateur);
    }

    public void supprimer(Long id) {
        utilisateurRepository.deleteById(id);
    }

    public Utilisateur findById(Long id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur non trouvé avec l'id : " + id));
    }

    public UtilisateurResponse toResponse(Utilisateur u) {
        return UtilisateurResponse.builder()
                .id(u.getId())
                .nom(u.getNom())
                .prenom(u.getPrenom())
                .email(u.getEmail())
                .telephone(u.getTelephone())
                .dateInscription(u.getDateInscription())
                .miniBio(u.getMiniBio())
                .photo(u.getPhoto())
                .verifie(u.isVerifie())
                .build();
    }
}