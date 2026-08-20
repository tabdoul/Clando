package com.example.wayvo.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.example.wayvo.dtos.request.ReservationRequest;
import com.example.wayvo.dtos.response.ReservationResponse;
import com.example.wayvo.entity.Document;
import com.example.wayvo.entity.Reservation;
import com.example.wayvo.entity.Trajet;
import com.example.wayvo.entity.Utilisateur;
import com.example.wayvo.repository.DocumentRepository;
import com.example.wayvo.repository.ReservationRepository;
import com.example.wayvo.repository.SignalementRepository;
import com.example.wayvo.repository.TrajetRepository;
import com.example.wayvo.repository.UtilisateurRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class ReservationService {

    private static final Logger log = LoggerFactory.getLogger(ReservationService.class);
    private static final double COMMISSION = 1.13;
    private static final List<Document.TypeDocument> PIECES_IDENTITE_ACCEPTEES =
        Arrays.asList(Document.TypeDocument.CNI, Document.TypeDocument.PASSEPORT);
    private static final List<com.example.wayvo.entity.Signalement.StatutSignalement> STATUTS_SIGNALEMENT_BLOQUANTS =
        Arrays.asList(
            com.example.wayvo.entity.Signalement.StatutSignalement.OUVERT,
            com.example.wayvo.entity.Signalement.StatutSignalement.EN_COURS
        );

    private final ReservationRepository reservationRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final TrajetRepository trajetRepository;
    private final DjomyService djomyService;
    private final NotificationService notificationService;
    private final DocumentRepository documentRepository;
    private final SignalementRepository signalementRepository;

    public ReservationService(ReservationRepository reservationRepository,
                               UtilisateurRepository utilisateurRepository,
                               TrajetRepository trajetRepository,
                               DjomyService djomyService,
                               NotificationService notificationService,
                               DocumentRepository documentRepository,
                               SignalementRepository signalementRepository) {
        this.reservationRepository = reservationRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.trajetRepository = trajetRepository;
        this.djomyService = djomyService;
        this.notificationService = notificationService;
        this.documentRepository = documentRepository;
        this.signalementRepository = signalementRepository;
    }

    @Transactional
    public ReservationResponse creer(ReservationRequest request) {
        Utilisateur passager = utilisateurRepository.findById(request.getPassagerId())
                .orElseThrow(() -> new EntityNotFoundException("Passager non trouve"));

        boolean estPremiereReservation = reservationRepository.countByPassagerId(passager.getId()) == 0;
        if (!estPremiereReservation) {
            boolean piecesIdentiteValidee = documentRepository.existsByUtilisateurIdAndTypeInAndStatut(
                passager.getId(), PIECES_IDENTITE_ACCEPTEES, Document.StatutDocument.VALIDE
            );
            if (!piecesIdentiteValidee) {
                throw new IllegalStateException(
                    "Une piece d'identite (CNI ou passeport) validee est requise a partir de votre 2e reservation"
                );
            }
        }

        Trajet trajet = trajetRepository.findById(request.getTrajetId())
                .orElseThrow(() -> new EntityNotFoundException("Trajet non trouve"));

        if (trajet.getPlacesDisponibles() < request.getNbPlaces()) {
            throw new IllegalStateException("Pas assez de places disponibles");
        }
        
        if (trajet.isFemmesUniquement()) {
            String genrePassager = passager.getGenre();
            if (genrePassager == null || !genrePassager.equals("FEMME")) {
                throw new IllegalStateException("Ce trajet est reserve aux femmes uniquement");
            }
        }

        Reservation reservation = new Reservation();
        reservation.setPassager(passager);
        reservation.setTrajet(trajet);
        reservation.setNbPlaces(request.getNbPlaces());
        reservation.setStatut(Reservation.StatutReservation.EN_ATTENTE);
        reservation.setDateReservation(LocalDate.now());
        reservation.setNbTentatives(0);
        reservation.setDepartPassager(request.getDepartPassager());
        reservation.setArriveePassager(request.getArriveePassager());

        if (request.getPrixPropose() != null &&
            !request.getPrixPropose().equals(trajet.getPrix())) {
            reservation.setPrixPropose(request.getPrixPropose());
        }

        trajet.setPlacesDisponibles(trajet.getPlacesDisponibles() - request.getNbPlaces());
        trajetRepository.save(trajet);

        //  Notification avec les villes du passager
        String tokenConducteur = trajet.getConducteur().getExpoPushToken();
        if (tokenConducteur != null && !tokenConducteur.isBlank()) {
            String departAffiche = request.getDepartPassager() != null
                ? request.getDepartPassager()
                : trajet.getVilleDepart();
            String arriveeAffichee = request.getArriveePassager() != null
                ? request.getArriveePassager()
                : trajet.getVilleArrivee();

            notificationService.envoyerNotification(
                tokenConducteur,
                "Nouvelle reservation !",
                passager.getPrenom() + " " + passager.getNom() +
                " veut reserver de " + departAffiche +
                " a " + arriveeAffichee
            );
        }

        return toResponse(reservationRepository.save(reservation));
    }

    //  Mode test — à retirer avant mise en prod
    @Transactional
    public ReservationResponse simulerPaiement(Long id) {
        Reservation reservation = findById(id);
        if (reservation.getStatut() != Reservation.StatutReservation.CONFIRMEE) {
            throw new IllegalStateException("La reservation doit etre confirmee pour payer");
        }
        reservation.setStatutPaiement("SUCCESS");

        String token = reservation.getPassager().getExpoPushToken();
        if (token != null && !token.isBlank()) {
            notificationService.envoyerNotification(
                token,
                "Paiement confirme !",
                "Votre paiement pour le trajet " +
                reservation.getTrajet().getVilleDepart() + " -> " +
                reservation.getTrajet().getVilleArrivee() +
                " a bien ete recu."
            );
        }

        return toResponse(reservationRepository.save(reservation));
    }

    public List<ReservationResponse> getReservationsConfirmeesParConducteur(Long conducteurId) {
        return reservationRepository.findReservationsConfirmeesParConducteur(conducteurId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReservationResponse initierPaiement(Long reservationId, String numeroTelephone) {
        Reservation reservation = findById(reservationId);

        if (reservation.getStatut() != Reservation.StatutReservation.CONFIRMEE) {
            throw new IllegalStateException("La reservation doit etre confirmee pour payer");
        }

        if ("SUCCESS".equals(reservation.getStatutPaiement())) {
            throw new IllegalStateException("Cette reservation est deja payee");
        }

        Trajet trajet = reservation.getTrajet();
        double prixBase = reservation.getPrixPropose() != null
            ? reservation.getPrixPropose()
            : trajet.getPrix();
        double montant = Math.round(prixBase * COMMISSION);
        String description = "Reservation Wayvo : " +
            trajet.getVilleDepart() + " -> " + trajet.getVilleArrivee();
        String reference = "WAYVO-" + System.currentTimeMillis();

        try {
            Map<String, Object> paiement = djomyService.initierPaiementOM(
                numeroTelephone, montant, reference, description
            );
            Map<String, Object> data = (Map<String, Object>) paiement.get("data");
            if (data != null) {
                if (data.containsKey("transactionId")) {
                    reservation.setDjomyTransactionId((String) data.get("transactionId"));
                }
                reservation.setStatutPaiement("PENDING");
                reservation.setNumeroTelephone(numeroTelephone);
            }
        } catch (Exception e) {
            throw new IllegalStateException("Erreur lors de l'initiation du paiement : " + e.getMessage());
        }

        return toResponse(reservationRepository.save(reservation));
    }

    @Transactional
    public Map<String, Object> annuler(Long id) {
        Reservation reservation = findById(id);

        if (reservation.getStatut() == Reservation.StatutReservation.ANNULEE) {
            throw new IllegalStateException("Cette reservation est deja annulee");
        }

        if (reservation.getStatut() == Reservation.StatutReservation.TERMINEE) {
            throw new IllegalStateException("Impossible d'annuler un trajet termine");
        }

        Trajet trajet = reservation.getTrajet();
        LocalDateTime maintenant = ZonedDateTime.now(ZoneId.of("Africa/Conakry")).toLocalDateTime();
        LocalDateTime heureDepart = trajet.getDateHeureDepart();

        boolean apresConfirmation = reservation.getStatut() == Reservation.StatutReservation.CONFIRMEE;
        boolean aPaye = "SUCCESS".equals(reservation.getStatutPaiement());
        boolean moinsDe2h = heureDepart.minusHours(2).isBefore(maintenant);

        double prixBase = reservation.getPrixPropose() != null
            ? reservation.getPrixPropose()
            : trajet.getPrix();
        double montantPaye = Math.round(prixBase * COMMISSION);
        double montantRembourse;
        double fraisAnnulation = 0;
        String typeRemboursement;

        if (!apresConfirmation || !aPaye) {
            typeRemboursement = "AUCUN";
            montantRembourse = 0;
        } else if (!moinsDe2h) {
            typeRemboursement = "TOTAL";
            montantRembourse = montantPaye;
        } else {
            typeRemboursement = "PARTIEL";
            fraisAnnulation = montantPaye * 0.10;
            montantRembourse = montantPaye - fraisAnnulation;
        }

        trajet.setPlacesDisponibles(trajet.getPlacesDisponibles() + reservation.getNbPlaces());
        trajetRepository.save(trajet);

        reservation.setStatut(Reservation.StatutReservation.ANNULEE);
        reservationRepository.save(reservation);

        String message;
        if (typeRemboursement.equals("AUCUN")) {
            message = "Reservation annulee. Aucun remboursement (paiement non effectue).";
        } else if (typeRemboursement.equals("TOTAL")) {
            message = "Remboursement integral de " + (long) montantRembourse + " GNF sous 24-48h";
        } else {
            message = "Remboursement de " + (long) montantRembourse + " GNF sous 24-48h (frais d'annulation : " + (long) fraisAnnulation + " GNF)";
        }

        return Map.of(
            "typeRemboursement", typeRemboursement,
            "montantPaye", montantPaye,
            "montantRembourse", montantRembourse,
            "fraisAnnulation", fraisAnnulation,
            "message", message
        );
    }

    @Transactional
    public ReservationResponse repondreNegociation(Long reservationId, boolean accepter, Double prixConducteur) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new EntityNotFoundException("Reservation non trouvee"));

        if (accepter) {
            reservation.setStatut(Reservation.StatutReservation.CONFIRMEE);
            reservation.setDateConfirmation(
                ZonedDateTime.now(ZoneId.of("Africa/Conakry")).toLocalDateTime()
            );
            String token = reservation.getPassager().getExpoPushToken();
            if (token != null && !token.isBlank()) {
                notificationService.envoyerNotification(
                    token,
                    "Reservation confirmee !",
                    "Votre trajet " + reservation.getTrajet().getVilleDepart() +
                    " -> " + reservation.getTrajet().getVilleArrivee() +
                    " est confirme. Vous avez 30 minutes pour effectuer le paiement."
                );
            }
        } else if (prixConducteur != null) {
            reservation.setStatut(Reservation.StatutReservation.CONTRE_OFFRE);
            reservation.setPrixConducteur(prixConducteur);

            String token = reservation.getPassager().getExpoPushToken();
            if (token != null && !token.isBlank()) {
                notificationService.envoyerNotification(
                    token,
                    "Contre-offre recue !",
                    "Le conducteur propose " + prixConducteur.longValue() +
                    " GNF pour votre trajet. Acceptez ou refusez dans l'application."
                );
            }
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
                .orElseThrow(() -> new EntityNotFoundException("Reservation non trouvee"));

        if (reservation.getStatut() != Reservation.StatutReservation.PRIX_REFUSE
            && reservation.getStatut() != Reservation.StatutReservation.CONTRE_OFFRE) {
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

    public List<ReservationResponse> getAll() {
        return reservationRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

   
    public ReservationResponse changerStatut(Long id, Reservation.StatutReservation statut) {
        Reservation reservation = findById(id);
        reservation.setStatut(statut);

        if (statut == Reservation.StatutReservation.ANNULEE) {
            Trajet trajet = reservation.getTrajet();
            trajet.setPlacesDisponibles(
                trajet.getPlacesDisponibles() + reservation.getNbPlaces()
            );
            trajetRepository.save(trajet);
        }

        
        if (statut == Reservation.StatutReservation.TERMINEE) {
            reservation.setDateTerminee(
                ZonedDateTime.now(ZoneId.of("Africa/Conakry")).toLocalDateTime()
            );
        }

        return toResponse(reservationRepository.save(reservation));
    }

    //  Payout groupe au conducteur : regroupe toutes les reservations eligibles (payees,
    // pas encore versees, sans signalement bloquant) d'un meme trajet en UN SEUL virement,
    // au lieu d'un virement par reservation.
    @Transactional
    public void effectuerPayoutGroupeConducteur(List<Reservation> reservations) {
        if (reservations == null || reservations.isEmpty()) {
            return;
        }

        List<Reservation> eligibles = new ArrayList<>();
        for (Reservation r : reservations) {
            if (r.isPayoutEffectue()) {
                continue;
            }
            if (!"SUCCESS".equals(r.getStatutPaiement())) {
                log.warn("Payout groupe ignore pour reservation {} : passager n'a pas paye", r.getId());
                continue;
            }

            boolean signalementBloquant = signalementRepository.existsByReservationIdAndStatutIn(
                r.getId(), STATUTS_SIGNALEMENT_BLOQUANTS
            );
            if (signalementBloquant) {
                log.warn("Payout groupe : reservation {} exclue (signalement en cours)", r.getId());
                String tokenConducteurBloque = r.getTrajet().getConducteur().getExpoPushToken();
                if (tokenConducteurBloque != null && !tokenConducteurBloque.isBlank()) {
                    notificationService.envoyerNotification(
                        tokenConducteurBloque,
                        "Paiement partiellement bloque",
                        "Une partie du paiement pour le trajet " +
                        r.getTrajet().getVilleDepart() + " -> " + r.getTrajet().getVilleArrivee() +
                        " est bloquee car un signalement est en cours d'examen."
                    );
                }
                continue;
            }

            eligibles.add(r);
        }

        if (eligibles.isEmpty()) {
            return;
        }

        Reservation premiere = eligibles.get(0);
        Trajet trajet = premiere.getTrajet();
        Utilisateur conducteur = trajet.getConducteur();

        String telephoneConducteur = conducteur.getTelephone();
        if (telephoneConducteur == null || telephoneConducteur.isBlank()) {
            log.warn("Payout groupe impossible pour trajet {} : conducteur sans numero de telephone", trajet.getId());
            return;
        }

        double montantTotal = eligibles.stream()
            .mapToDouble(r -> r.getPrixPropose() != null ? r.getPrixPropose() : r.getTrajet().getPrix())
            .sum();

        String reference = "PAYOUT-TRAJET-" + trajet.getId() + "-" + System.currentTimeMillis();
        String description = "Payout Wayvo - trajet " +
            trajet.getVilleDepart() + " -> " + trajet.getVilleArrivee() +
            " (" + eligibles.size() + " passager" + (eligibles.size() > 1 ? "s" : "") + ")";

        try {
            Map<String, Object> reponsePayout = djomyService.initierPayout(
                telephoneConducteur,
                conducteur.getPrenom() + " " + conducteur.getNom(),
                montantTotal, reference, description, false
            );

            extraireEtEnregistrerReferencesPayout(reponsePayout, eligibles);

            for (Reservation r : eligibles) {
                r.setPayoutEffectue(true);
                r.setStatutPayout("PENDING");
                reservationRepository.save(r);
            }

            log.info("Payout groupe initie pour trajet {} ({} reservation(s), {} GNF, conducteur {})",
                trajet.getId(), eligibles.size(), montantTotal, conducteur.getId());

        } catch (Exception e) {
            log.error("Erreur payout groupe trajet {} : {}", trajet.getId(), e.getMessage());
        }
    }

    //  Extrait orderId/itemId de la reponse Djomy (data.id, data.payoutItems[0].itemId)
    // et les enregistre sur toutes les reservations du groupe, pour permettre le retry cible plus tard
    @SuppressWarnings("unchecked")
    private void extraireEtEnregistrerReferencesPayout(Map<String, Object> reponse, List<Reservation> reservations) {
        try {
            Map<String, Object> data = (Map<String, Object>) reponse.get("data");
            if (data == null) {
                return;
            }
            String orderId = (String) data.get("id");
            List<Map<String, Object>> items = (List<Map<String, Object>>) data.get("payoutItems");
            String itemId = (items != null && !items.isEmpty()) ? (String) items.get(0).get("itemId") : null;

            for (Reservation r : reservations) {
                r.setPayoutOrderId(orderId);
                r.setPayoutItemId(itemId);
            }
        } catch (Exception e) {
            log.warn("Impossible d'extraire orderId/itemId de la reponse payout : {}", e.getMessage());
        }
    }

    public void supprimer(Long id) {
        reservationRepository.deleteById(id);
    }

    public Reservation findById(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Reservation non trouvee avec l'id : " + id));
    }

    public List<ReservationResponse> getReservationsEnAttenteParConducteur(Long conducteurId) {
        return reservationRepository.findReservationsEnAttenteParConducteur(conducteurId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ReservationResponse> getPassagersConfirmes(Long trajetId) {
        return reservationRepository.findPassagersConfirmes(trajetId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ReservationResponse toResponse(Reservation r) {
    double prixBase = r.getPrixPropose() != null
        ? r.getPrixPropose()
        : r.getTrajet().getPrix();

    return ReservationResponse.builder()
            .id(r.getId())
            .dateReservation(r.getDateReservation())
            .nbPlaces(r.getNbPlaces())
            .statut(r.getStatut())
            .passagerId(r.getPassager().getId())
            .passagerNom(r.getPassager().getNom())
            .passagerPrenom(r.getPassager().getPrenom())
            .passagerPhoto(r.getPassager().getPhoto())
            .passagerTelephone((String) null)
            .conducteurId(r.getTrajet().getConducteur().getId())
            .conducteurNom(r.getTrajet().getConducteur().getNom())
            .conducteurPrenom(r.getTrajet().getConducteur().getPrenom())
            .trajetId(r.getTrajet().getId())
            .villeDepart(r.getTrajet().getVilleDepart())
            .villeArrivee(r.getTrajet().getVilleArrivee())
            .prixPropose(r.getPrixPropose())
            .prixConducteur(r.getPrixConducteur())
            .nbTentatives(r.getNbTentatives())
            .djomyTransactionId(r.getDjomyTransactionId())
            .statutPaiement(r.getStatutPaiement())
            .urlPaiement(r.getUrlPaiement())
            .trajetDemarre(r.getTrajet().isTrajetDemarre())
            .latitudeConducteur(r.getTrajet().getLatitudeConducteur())
            .longitudeConducteur(r.getTrajet().getLongitudeConducteur())
            .dateConfirmation(r.getDateConfirmation())
            .prix(Math.round(prixBase * COMMISSION))
            .departPassager(r.getDepartPassager())
            .arriveePassager(r.getArriveePassager())
            .dateHeureDepart(r.getTrajet().getDateHeureDepart())
            .payoutEffectue(r.isPayoutEffectue())
            .build();
}
}