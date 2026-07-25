package com.example.wayvo.service;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.wayvo.dtos.request.UtilisateurRequest;
import com.example.wayvo.dtos.response.UtilisateurResponse;
import com.example.wayvo.entity.Utilisateur;
import com.example.wayvo.repository.UtilisateurRepository;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final CloudinaryService cloudinaryService;
    private final EmailService emailService; // ✅ ajouté

    public UtilisateurService(UtilisateurRepository utilisateurRepository,
                               PasswordEncoder passwordEncoder,
                               CloudinaryService cloudinaryService,
                               EmailService emailService) { // ✅ ajouté
        this.utilisateurRepository = utilisateurRepository;
        this.passwordEncoder = passwordEncoder;
        this.cloudinaryService = cloudinaryService;
        this.emailService = emailService; // ✅ ajouté
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
                .genre(request.getGenre())
                .build();

        return toResponse(utilisateurRepository.save(utilisateur));
    }

    // ✅ Demande de reset — envoie le code par email
    public void demanderResetPassword(String email) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Aucun compte associé à cet email"));

        String code = String.format("%06d", new Random().nextInt(999999));
        utilisateur.setResetCode(code);
        utilisateur.setResetCodeExpiration(LocalDateTime.now().plusMinutes(15));
        utilisateurRepository.save(utilisateur);

        emailService.envoyerCodeReset(email, code);
    }

    // ✅ Vérification du code
    public void verifierCode(String email, String code) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Email introuvable"));

        if (utilisateur.getResetCode() == null || !utilisateur.getResetCode().equals(code)) {
            throw new RuntimeException("Code incorrect");
        }

        if (utilisateur.getResetCodeExpiration().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Code expiré, veuillez faire une nouvelle demande");
        }
    }

    // ✅ Reset du mot de passe
    public void resetPassword(String email, String code, String nouveauMotDePasse) {
        verifierCode(email, code);

        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Email introuvable"));

        utilisateur.setMotDePasse(passwordEncoder.encode(nouveauMotDePasse));
        utilisateur.setResetCode(null);
        utilisateur.setResetCodeExpiration(null);
        utilisateurRepository.save(utilisateur);
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
        utilisateur.setGenre(request.getGenre());
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
                .genre(u.getGenre())
                .build();
    }
}