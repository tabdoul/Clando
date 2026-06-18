package com.example.Clando.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Clando.dtos.request.ReservationRequest;
import com.example.Clando.dtos.response.ReservationResponse;
import com.example.Clando.entity.Reservation;
import com.example.Clando.entity.Trajet;
import com.example.Clando.entity.Utilisateur;
import com.example.Clando.repository.ReservationRepository;
import com.example.Clando.repository.TrajetRepository;
import com.example.Clando.repository.UtilisateurRepository;

import jakarta.persistence.EntityNotFoundException;
import com.example.Clando.service.DjomyService;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final TrajetRepository trajetRepository;
    private final DjomyService djomyService;

    public ReservationService(ReservationRepository reservationRepository,
                               UtilisateurRepository utilisateurRepository,
                               TrajetRepository trajetRepository,
                               DjomyService djomyService) {
        this.reservationRepository = reservationRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.trajetRepository = trajetRepository;
        this.djomyService = djomyService;
    }

    @Transactional
    public ReservationResponse creer(ReservationRequest request) {
        System.out.println("=== CREER RESERVATION ===");
        System.out.println("=== Numero telephone: " + request.getNumeroTelephone());

        Utilisateur passager = utilisateurRepository.findById(request.getPassagerId())
                .orElseThrow(() -> new EntityNotFoundException("Passager non trouvé"));

        Trajet trajet = trajetRepository.findById(request.getTrajetId())
                .orElseThrow(() -> new EntityNotFoundException("Trajet non trouvé"));

        if (trajet.getPlacesDisponibles() < request.getNbPlaces()) {
            throw new IllegalStateException("Pas assez de places disponibles");
        }

        Reservation reservation = new Reservation();
        reservation.setPassager(passager);
        reservation.setTrajet(trajet);
        reservation.setNbPlaces(request.getNbPlaces());
        reservation.setStatut(Reservation.StatutReservation.EN_ATTENTE);
        reservation.setDateReservation(LocalDate.now());
        reservation.setNbTentatives(0);

        if (request.getPrixPropose() != null &&
            !request.getPrixPropose().equals(trajet.getPrix())) {
            reservation.setPrixPropose(request.getPrixPropose());
        }

        if (request.getNumeroTelephone() != null && !request.getNumeroTelephone().isBlank()) {
            System.out.println("=== Initier paiement gateway...");
            try {
                double montant = request.getPrixPropose() != null
                    ? request.getPrixPropose()
                    : trajet.getPrix();

                String description = "Réservation Clando : " +
                    trajet.getVilleDepart() + " → " + trajet.getVilleArrivee();

                String reference = "CLANDO-" + System.currentTimeMillis();

                Map<String, Object> paiement = djomyService.initierPaiementGateway(
                    request.getNumeroTelephone(),
                    montant,
                    reference,
                    description
                );

                System.out.println("=== Réponse Djomy: " + paiement);

                Map<String, Object> data = (Map<String, Object>) paiement.get("data");
                System.out.println("=== Data: " + data);

                if (data != null) {
                    if (data.containsKey("transactionId")) {
                        reservation.setDjomyTransactionId((String) data.get("transactionId"));
                    }
                    if (data.containsKey("redirectUrl")) {
    System.out.println("=== URL Paiement: " + data.get("redirectUrl"));
    reservation.setUrlPaiement((String) data.get("redirectUrl"));
}
                    reservation.setStatutPaiement("PENDING");
                    reservation.setNumeroTelephone(request.getNumeroTelephone());
                }
            } catch (Exception e) {
                System.out.println("=== Erreur paiement Djomy: " + e.getMessage());
            }
        } else {
            System.out.println("=== Pas de numero telephone fourni");
        }

        trajet.setPlacesDisponibles(trajet.getPlacesDisponibles() - request.getNbPlaces());
        trajetRepository.save(trajet);

        return toResponse(reservationRepository.save(reservation));
    }

    @Transactional
    public ReservationResponse repondreNegociation(Long reservationId, boolean accepter) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new EntityNotFoundException("Réservation non trouvée"));

        if (accepter) {
            reservation.setStatut(Reservation.StatutReservation.CONFIRMEE);
        } else {
            if (reservation.getNbTentatives() >= 1) {
                reservation.setStatut(Reservation.StatutReservation.REFUSEE);
                Trajet trajet = reservation.getTrajet();
                trajet.setPlacesDisponibles(
                    trajet.getPlacesDisponibles() + reservation.getNbPlaces()
                );
                trajetRepository.save(trajet);
            } else {
                reservation.setStatut(Reservation.StatutReservation.PRIX_REFUSE);
                reservation.setNbTentatives(reservation.getNbTentatives() + 1);
            }
        }

        return toResponse(reservationRepository.save(reservation));
    }

    @Transactional
    public ReservationResponse nouvelleProposition(Long reservationId, Double nouveauPrix) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new EntityNotFoundException("Réservation non trouvée"));

        if (reservation.getStatut() != Reservation.StatutReservation.PRIX_REFUSE) {
            throw new IllegalStateException("Impossible de faire une nouvelle proposition");
        }

        if (reservation.getNbTentatives() >= 2) {
            throw new IllegalStateException("Nombre maximum de tentatives atteint");
        }

        reservation.setPrixPropose(nouveauPrix);
        reservation.setStatut(Reservation.StatutReservation.EN_ATTENTE);

        return toResponse(reservationRepository.save(reservation));
    }

    public ReservationResponse getById(Long id) {
        return toResponse(findById(id));
    }

    public List<ReservationResponse> getByPassager(Long passagerId) {
        return reservationRepository.findByPassagerId(passagerId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ReservationResponse> getByTrajet(Long trajetId) {
        return reservationRepository.findByTrajetId(trajetId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ReservationResponse changerStatut(Long id, Reservation.StatutReservation statut) {
        Reservation reservation = findById(id);
        reservation.setStatut(statut);
        return toResponse(reservationRepository.save(reservation));
    }

    public void supprimer(Long id) {
        reservationRepository.deleteById(id);
    }

    public Reservation findById(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Réservation non trouvée avec l'id : " + id));
    }

    public List<ReservationResponse> getReservationsEnAttenteParConducteur(Long conducteurId) {
        return reservationRepository.findReservationsEnAttenteParConducteur(conducteurId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ReservationResponse toResponse(Reservation r) {
        return ReservationResponse.builder()
                .id(r.getId())
                .dateReservation(r.getDateReservation())
                .nbPlaces(r.getNbPlaces())
                .statut(r.getStatut())
                .passagerId(r.getPassager().getId())
                .passagerNom(r.getPassager().getNom())
                .passagerPrenom(r.getPassager().getPrenom())
                .conducteurId(r.getTrajet().getConducteur().getId())
                .conducteurNom(r.getTrajet().getConducteur().getNom())
                .conducteurPrenom(r.getTrajet().getConducteur().getPrenom())
                .trajetId(r.getTrajet().getId())
                .villeDepart(r.getTrajet().getVilleDepart())
                .villeArrivee(r.getTrajet().getVilleArrivee())
                .prixPropose(r.getPrixPropose())
                .nbTentatives(r.getNbTentatives())
                .passagerPhoto(r.getPassager().getPhoto())
                .djomyTransactionId(r.getDjomyTransactionId())
                .statutPaiement(r.getStatutPaiement())
                .urlPaiement(r.getUrlPaiement())
                .build();
    }
}