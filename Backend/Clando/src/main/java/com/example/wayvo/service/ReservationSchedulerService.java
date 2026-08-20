package com.example.wayvo.service;

import com.example.wayvo.entity.Reservation;
import com.example.wayvo.entity.Trajet;
import com.example.wayvo.repository.ReservationRepository;
import com.example.wayvo.repository.TrajetRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReservationSchedulerService {

    private static final Logger log = LoggerFactory.getLogger(ReservationSchedulerService.class);
    private static final int DELAI_PAIEMENT_MINUTES = 30;
    private static final int DELAI_PAYOUT_MINUTES = 15;
    private static final int MAX_PAYOUT_RETRY = 3;

    private final ReservationRepository reservationRepository;
    private final TrajetRepository trajetRepository;
    private final NotificationService notificationService;
    private final ReservationService reservationService;
    private final DjomyService djomyService;

    public ReservationSchedulerService(ReservationRepository reservationRepository,
                                        TrajetRepository trajetRepository,
                                        NotificationService notificationService,
                                        ReservationService reservationService,
                                        DjomyService djomyService) {
        this.reservationRepository = reservationRepository;
        this.trajetRepository = trajetRepository;
        this.notificationService = notificationService;
        this.reservationService = reservationService;
        this.djomyService = djomyService;
    }

    private LocalDateTime maintenant() {
        return ZonedDateTime.now(ZoneId.of("Africa/Conakry")).toLocalDateTime();
    }

    // Toutes les 5 minutes
    @Scheduled(fixedRate = 5 * 60 * 1000)
    @Transactional
    public void annulerDemandesEnAttenteDepartPasse() {
        List<Reservation> demandesExpirees = reservationRepository.findDemandesEnAttenteDepartPasse(maintenant());

        for (Reservation reservation : demandesExpirees) {
            Trajet trajet = reservation.getTrajet();
            trajet.setPlacesDisponibles(trajet.getPlacesDisponibles() + reservation.getNbPlaces());
            trajetRepository.save(trajet);

            reservation.setStatut(Reservation.StatutReservation.ANNULEE);
            reservationRepository.save(reservation);

            String token = reservation.getPassager().getExpoPushToken();
            if (token != null && !token.isBlank()) {
                notificationService.envoyerNotification(
                    token,
                    "Demande expiree",
                    "Le conducteur n'a pas repondu avant le depart du trajet " +
                    trajet.getVilleDepart() + " -> " + trajet.getVilleArrivee() +
                    ". Recherchez un autre trajet."
                );
            }

            log.info("Demande {} annulee automatiquement (heure de depart du trajet atteinte)",
                reservation.getId());
        }
    }

    // Toutes les 5 minutes
    @Scheduled(fixedRate = 5 * 60 * 1000)
    @Transactional
    public void annulerReservationsNonPayeesExpirees() {
        LocalDateTime limite = maintenant().minusMinutes(DELAI_PAIEMENT_MINUTES);
        List<Reservation> reservationsExpirees = reservationRepository.findReservationsNonPayeesExpired(limite);

        for (Reservation reservation : reservationsExpirees) {
            Trajet trajet = reservation.getTrajet();
            trajet.setPlacesDisponibles(trajet.getPlacesDisponibles() + reservation.getNbPlaces());
            trajetRepository.save(trajet);

            reservation.setStatut(Reservation.StatutReservation.ANNULEE);
            reservationRepository.save(reservation);

            String token = reservation.getPassager().getExpoPushToken();
            if (token != null && !token.isBlank()) {
                notificationService.envoyerNotification(
                    token,
                    "Reservation annulee",
                    "Le paiement n'a pas ete effectue dans les " + DELAI_PAIEMENT_MINUTES +
                    " minutes pour le trajet " + trajet.getVilleDepart() + " -> " + trajet.getVilleArrivee() + "."
                );
            }

            log.info("Reservation {} annulee automatiquement (paiement non effectue sous {}min)",
                reservation.getId(), DELAI_PAIEMENT_MINUTES);
        }
    }

    // Nouveau — verse les payouts dus (30 min apres la fin du trajet, sauf signalement bloquant)
    // Regroupe par trajet : un seul virement au conducteur pour toutes les reservations
    // pretes d'un meme trajet, au lieu d'un virement separe par reservation.
    // Toutes les 5 minutes
    @Scheduled(fixedRate = 5 * 60 * 1000)
    @Transactional
    public void verserPayoutsDus() {
        LocalDateTime limite = maintenant().minusMinutes(DELAI_PAYOUT_MINUTES);
        List<Reservation> payoutsDus = reservationRepository.findPayoutsDus(limite);

        Map<Long, List<Reservation>> parTrajet = payoutsDus.stream()
            .collect(Collectors.groupingBy(r -> r.getTrajet().getId()));

        for (List<Reservation> groupe : parTrajet.values()) {
            reservationService.effectuerPayoutGroupeConducteur(groupe);
        }

        if (!payoutsDus.isEmpty()) {
            log.info("Traitement de {} payout(s) du(s) sur {} trajet(s)", payoutsDus.size(), parTrajet.size());
        }
    }

    // Relance automatiquement les payouts en echec aupres de Djomy, jusqu'a MAX_PAYOUT_RETRY tentatives.
    // Plusieurs reservations peuvent partager le meme orderId/itemId (payout groupe par trajet) —
    // on deduplique pour ne relancer qu'une seule fois par virement, pas une fois par reservation.
    // Le statut final (SUCCESS/FAILED) est mis a jour par le webhook, pas ici.
    // Toutes les 15 minutes
    @Scheduled(fixedRate = 15 * 60 * 1000)
    @Transactional
    public void relancerPayoutsEchoues() {
        List<Reservation> echecs = reservationRepository.findPayoutsEchouesEligiblesRetry(MAX_PAYOUT_RETRY);

        Map<String, List<Reservation>> parPayoutItem = echecs.stream()
            .collect(Collectors.groupingBy(r -> r.getPayoutOrderId() + "|" + r.getPayoutItemId()));

        for (List<Reservation> groupe : parPayoutItem.values()) {
            Reservation reference = groupe.get(0);
            try {
                boolean relance = djomyService.retryPayoutItem(
                    reference.getPayoutOrderId(),
                    reference.getPayoutItemId()
                );

                if (relance) {
                    for (Reservation r : groupe) {
                        r.setPayoutRetryCount(r.getPayoutRetryCount() + 1);
                        reservationRepository.save(r);

                        if (r.getPayoutRetryCount() >= MAX_PAYOUT_RETRY) {
                            log.warn("Reservation {} : nombre max de tentatives de retry payout atteint ({})",
                                r.getId(), MAX_PAYOUT_RETRY);
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Erreur lors du retry payout groupe orderId={} - {}",
                    reference.getPayoutOrderId(), e.getMessage());
            }
        }

        if (!echecs.isEmpty()) {
            log.info("Tentative de relance de {} payout(s) en echec sur {} virement(s) groupe(s)",
                echecs.size(), parPayoutItem.size());
        }
    }
}