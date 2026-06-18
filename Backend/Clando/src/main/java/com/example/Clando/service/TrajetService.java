package com.example.Clando.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Clando.dtos.request.TrajetRequest;
import com.example.Clando.dtos.response.TrajetResponse;
import com.example.Clando.entity.Document;
import com.example.Clando.entity.Reservation;
import com.example.Clando.entity.Trajet;
import com.example.Clando.entity.Utilisateur;
import com.example.Clando.entity.Vehicule;
import com.example.Clando.repository.AvisRepository;
import com.example.Clando.repository.DocumentRepository;
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
    private final ItineraireService itineraireService;
    private final DocumentRepository documentRepository;

    public TrajetService(TrajetRepository trajetRepository,
                         UtilisateurService utilisateurService,
                         VehiculeService vehiculeService,
                         ReservationRepository reservationRepository,
                         UtilisateurRepository utilisateurRepository,
                         AvisRepository avisRepository,
                         ItineraireService itineraireService,
                         DocumentRepository documentRepository) {
        this.trajetRepository = trajetRepository;
        this.utilisateurService = utilisateurService;
        this.vehiculeService = vehiculeService;
        this.reservationRepository = reservationRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.avisRepository = avisRepository;
        this.itineraireService = itineraireService;
        this.documentRepository = documentRepository;
    }

    private LocalDateTime maintenant() {
        return ZonedDateTime.now(ZoneId.of("Africa/Conakry")).toLocalDateTime();
    }

    private String normaliser(String str) {
        if (str == null) return "";
        return str.toLowerCase()
            .replace("é", "e").replace("è", "e").replace("ê", "e")
            .replace("à", "a").replace("â", "a").replace("ô", "o")
            .replace("î", "i").replace("ù", "u").trim();
    }

    @Transactional
    public TrajetResponse creer(TrajetRequest request) {
        Utilisateur conducteur = utilisateurRepository.findById(request.getConducteurId())
                .orElseThrow(() -> new EntityNotFoundException("Conducteur non trouvé"));

        // Vérification des documents requis
        List<Document> documents = documentRepository.findByUtilisateurId(request.getConducteurId());

        boolean aPermis = documents.stream()
            .anyMatch(d -> d.getType() == Document.TypeDocument.PERMIS_CONDUIRE
                       && d.getStatut() == Document.StatutDocument.VALIDE);

        boolean aIdentite = documents.stream()
            .anyMatch(d -> (d.getType() == Document.TypeDocument.CNI
                       || d.getType() == Document.TypeDocument.PASSEPORT)
                       && d.getStatut() == Document.StatutDocument.VALIDE);

        if (!aPermis || !aIdentite) {
            throw new IllegalStateException(
                "Vous devez avoir un permis de conduire et une pièce d'identité validés pour publier un trajet"
            );
        }

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
        List<Trajet> tousLesTrajets = trajetRepository.findAll();
        List<TrajetResponse> resultats = tousLesTrajets.stream()
            .filter(t -> t.getStatut() == Trajet.StatutTrajet.OUVERT)
            .filter(t -> t.getDateHeureDepart().isAfter(maintenant()))
            .filter(t -> {
                String dep = normaliser(t.getVilleDepart());
                String arr = normaliser(t.getVilleArrivee());
                String depRecherche = normaliser(villeDepart);
                String arrRecherche = normaliser(villeArrivee);

                boolean departCorrespond = dep.equals(depRecherche) ||
                                           (dep.contains(depRecherche) && depRecherche.length() >= 4);
                boolean arriveeCorrespond = arr.equals(arrRecherche) ||
                                            (arr.contains(arrRecherche) && arrRecherche.length() >= 4);

                if (departCorrespond && arriveeCorrespond) return true;

                if (t.getItineraire() != null && depRecherche.length() >= 4 && arrRecherche.length() >= 4) {
                    return itineraireService.trajetCorrespond(
                        t.getItineraire(),
                        t.getVilleDepart(),
                        t.getVilleArrivee(),
                        villeDepart,
                        villeArrivee
                    );
                }

                return false;
            })
            .map(this::toResponse)
            .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), resultats.size());
        List<TrajetResponse> page = start > resultats.size() ? List.of() : resultats.subList(start, end);

        return new PageImpl<>(page, pageable, resultats.size());
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