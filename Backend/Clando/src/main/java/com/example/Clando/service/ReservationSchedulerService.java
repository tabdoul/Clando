package com.example.Clando.service;

import com.example.Clando.entity.Reservation;
import com.example.Clando.entity.Trajet;
import com.example.Clando.repository.ReservationRepository;
import com.example.Clando.repository.TrajetRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

@Service
public class ReservationSchedulerService {

    private static final Logger log = LoggerFactory.getLogger(ReservationSchedulerService.class);
    private static final int DELAI_PAIEMENT_MINUTES = 30;

    private final ReservationRepository reservationRepository;
    private final TrajetRepository trajetRepository;
    private final NotificationService notificationService;

    public ReservationSchedulerService(ReservationRepository reservationRepository,
                                        TrajetRepository trajetRepository,
                                        NotificationService notificationService) {
        this.reservationRepository = reservationRepository;
        this.trajetRepository = trajetRepository;
        this.notificationService = notificationService;
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
}