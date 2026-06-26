package com.example.Clando.scheduler;

import com.example.Clando.entity.Reservation;
import com.example.Clando.entity.Trajet;
import com.example.Clando.repository.ReservationRepository;
import com.example.Clando.repository.TrajetRepository;
import com.example.Clando.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

@Component
public class PaiementExpirationScheduler {

    private static final Logger log = LoggerFactory.getLogger(PaiementExpirationScheduler.class);

    private final ReservationRepository reservationRepository;
    private final TrajetRepository trajetRepository;
    private final NotificationService notificationService;

    public PaiementExpirationScheduler(ReservationRepository reservationRepository,
                                        TrajetRepository trajetRepository,
                                        NotificationService notificationService) {
        this.reservationRepository = reservationRepository;
        this.trajetRepository = trajetRepository;
        this.notificationService = notificationService;
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void annulerReservationsNonPayees() {
        LocalDateTime maintenant = ZonedDateTime.now(ZoneId.of("Africa/Conakry")).toLocalDateTime();
        LocalDateTime limite = maintenant.minusMinutes(30);

        List<Reservation> reservations = reservationRepository
            .findReservationsNonPayeesExpired(limite);

        if (reservations.isEmpty()) return;

        log.info("Expiration paiement : {} reservation(s) a annuler", reservations.size());

        for (Reservation reservation : reservations) {
            try {
                Trajet trajet = reservation.getTrajet();
                trajet.setPlacesDisponibles(
                    trajet.getPlacesDisponibles() + reservation.getNbPlaces()
                );
                trajetRepository.save(trajet);

                reservation.setStatut(Reservation.StatutReservation.ANNULEE);
                reservationRepository.save(reservation);

                String token = reservation.getPassager().getExpoPushToken();
                if (token != null && !token.isBlank()) {
                    notificationService.envoyerNotification(
                        token,
                        "Reservation annulee",
                        "Votre reservation " + trajet.getVilleDepart() +
                        " -> " + trajet.getVilleArrivee() +
                        " a ete annulee. Motif : paiement non effectue dans les 30 minutes."
                    );
                }

                log.info("Reservation {} annulee - paiement non effectue", reservation.getId());

            } catch (Exception e) {
                log.error("Erreur annulation reservation {}: {}", reservation.getId(), e.getMessage());
            }
        }
    }
}