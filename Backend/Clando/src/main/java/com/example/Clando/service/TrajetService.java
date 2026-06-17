package com.example.Clando.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Clando.dtos.request.TrajetRequest;
import com.example.Clando.dtos.response.TrajetResponse;
import com.example.Clando.entity.Reservation;
import com.example.Clando.entity.Trajet;
import com.example.Clando.entity.Utilisateur;
import com.example.Clando.entity.Vehicule;
import com.example.Clando.repository.AvisRepository;
import com.example.Clando.repository.ReservationRepository;
import com.example.Clando.repository.TrajetRepository;
import com.example.Clando.repository.UtilisateurRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class TrajetService {

    private final TrajetRepository trajetRepository;
    private final UtilisateurService utilisateurService;
    private final VehiculeService vehiculeService;
    private final ReservationRepository reservationRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final AvisRepository avisRepository;

    public TrajetService(TrajetRepository trajetRepository,
                         UtilisateurService utilisateurService,
                         VehiculeService vehiculeService,
                         ReservationRepository reservationRepository,
                         UtilisateurRepository utilisateurRepository,
                         AvisRepository avisRepository) {
        this.trajetRepository = trajetRepository;
        this.utilisateurService = utilisateurService;
        this.vehiculeService = vehiculeService;
        this.reservationRepository = reservationRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.avisRepository = avisRepository;
    }

    private LocalDateTime maintenant() {
        return ZonedDateTime.now(ZoneId.of("Africa/Conakry")).toLocalDateTime();
    }

    @Transactional
    public TrajetResponse creer(TrajetRequest request) {
        Utilisateur conducteur = utilisateurRepository.findById(request.getConducteurId())
                .orElseThrow(() -> new EntityNotFoundException("Conducteur non trouvé"));

        LocalDateTime debutJour = LocalDate.now(ZoneId.of("Africa/Conakry")).atStartOfDay();
        LocalDateTime finJour = debutJour.plusDays(1);
        long nbTrajetsAujourdhui = trajetRepository.countByConducteurIdAndDateCreationBetween(
                request.getConducteurId(), debutJour, finJour);

        if (nbTrajetsAujourdhui >= 3) {
            throw new IllegalStateException("Vous avez atteint la limite de 3 trajets par jour");
        }

        Vehicule vehicule = vehiculeService.findById(request.getVehiculeId());

        Trajet trajet = new Trajet();
        trajet.setConducteur(conducteur);
        trajet.setVehicule(vehicule);
        trajet.setVilleDepart(request.getVilleDepart());
        trajet.setVilleArrivee(request.getVilleArrivee());
        trajet.setDateHeureDepart(request.getDateHeureDepart());
        trajet.setPlacesDisponibles(request.getPlacesDisponibles());
        trajet.setPrix(request.getPrix());
        trajet.setItineraire(request.getItineraire());
        trajet.setStatut(Trajet.StatutTrajet.OUVERT);

        return toResponse(trajetRepository.save(trajet));
    }

    public TrajetResponse getById(Long id) {
        return toResponse(findById(id));
    }

    public List<TrajetResponse> getAll() {
        return trajetRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Page<TrajetResponse> rechercher(String villeDepart, String villeArrivee, Pageable pageable) {
        return trajetRepository
                .findByVilleDepartAndVilleArriveeIgnoreCase(
                    villeDepart,
                    villeArrivee,
                    maintenant(),
                    pageable
                )
                .map(this::toResponse);
    }

    public List<TrajetResponse> getByConducteur(Long conducteurId) {
        return trajetRepository.findByConducteurId(conducteurId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public TrajetResponse modifier(Long id, TrajetRequest request) {
        Trajet trajet = findById(id);
        trajet.setVilleDepart(request.getVilleDepart());
        trajet.setVilleArrivee(request.getVilleArrivee());
        trajet.setDateHeureDepart(request.getDateHeureDepart());
        trajet.setPlacesDisponibles(request.getPlacesDisponibles());
        trajet.setPrix(request.getPrix());
        trajet.setItineraire(request.getItineraire());
        return toResponse(trajetRepository.save(trajet));
    }

    @Transactional
    public TrajetResponse changerStatut(Long id, Trajet.StatutTrajet statut) {
        Trajet trajet = findById(id);
        trajet.setStatut(statut);

        if (statut == Trajet.StatutTrajet.ANNULE) {
            List<Reservation> reservations = reservationRepository.findByTrajetId(id);
            reservations.forEach(reservation -> {
                if (reservation.getStatut() == Reservation.StatutReservation.CONFIRMEE ||
                    reservation.getStatut() == Reservation.StatutReservation.EN_ATTENTE) {
                    reservation.setStatut(Reservation.StatutReservation.ANNULEE);
                    reservationRepository.save(reservation);
                }
            });
        }

        if (statut == Trajet.StatutTrajet.TERMINE) {
            List<Reservation> reservations = reservationRepository.findByTrajetId(id);
            reservations.forEach(reservation -> {
                if (reservation.getStatut() == Reservation.StatutReservation.CONFIRMEE) {
                    reservation.setStatut(Reservation.StatutReservation.TERMINEE);
                    reservationRepository.save(reservation);
                }
            });
        }

        return toResponse(trajetRepository.save(trajet));
    }

    public void supprimer(Long id) {
        trajetRepository.deleteById(id);
    }

    public Trajet findById(Long id) {
        return trajetRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Trajet non trouvé avec l'id : " + id));
    }

    public TrajetResponse toResponse(Trajet t) {
        Double noteMoyenne = avisRepository.findNoteMoyenneByDestinataire(t.getConducteur().getId());
        Long nbTrajets = avisRepository.countTrajetsTerminesByConducteur(t.getConducteur().getId());

        return TrajetResponse.builder()
                .id(t.getId())
                .villeDepart(t.getVilleDepart())
                .villeArrivee(t.getVilleArrivee())
                .dateHeureDepart(t.getDateHeureDepart())
                .placesDisponibles(t.getPlacesDisponibles())
                .prix(t.getPrix())
                .itineraire(t.getItineraire())
                .statut(t.getStatut())
                .conducteurId(t.getConducteur().getId())
                .conducteurNom(t.getConducteur().getNom())
                .conducteurPrenom(t.getConducteur().getPrenom())
                .conducteurPhoto(t.getConducteur().getPhoto())
                .vehiculeId(t.getVehicule().getId())
                .vehiculeMarque(t.getVehicule().getMarque())
                .vehiculeModele(t.getVehicule().getModele())
                .noteMoyenneConducteur(noteMoyenne != null ? Math.round(noteMoyenne * 10.0) / 10.0 : null)
                .nbTrajetsTerminesConducteur(nbTrajets != null ? nbTrajets : 0L)
                .build();
    }
}