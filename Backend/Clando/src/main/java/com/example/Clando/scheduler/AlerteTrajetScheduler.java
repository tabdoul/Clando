package com.example.Clando.scheduler;

import com.example.Clando.entity.Reservation;
import com.example.Clando.repository.ReservationRepository;
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
public class AlerteTrajetScheduler {

    private static final Logger log = LoggerFactory.getLogger(AlerteTrajetScheduler.class);

    private final ReservationRepository reservationRepository;
    private final NotificationService notificationService;

    public AlerteTrajetScheduler(ReservationRepository reservationRepository,
                                  NotificationService notificationService) {
        this.reservationRepository = reservationRepository;
        this.notificationService = notificationService;
    }

    // Tourne toutes les minutes
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void envoyerAlertesDepart() {
        LocalDateTime maintenant = ZonedDateTime.now(ZoneId.of("Africa/Conakry")).toLocalDateTime();

        // Fenêtre : trajets qui partent entre 29 et 31 minutes
        LocalDateTime debut = maintenant.plusMinutes(29);
        LocalDateTime fin = maintenant.plusMinutes(31);

        List<Reservation> reservations = reservationRepository.findReservationsANotifier(debut, fin);

        if (reservations.isEmpty()) return;

        log.info("Alertes depart : {} reservation(s) a notifier", reservations.size());

        for (Reservation reservation : reservations) {
            try {
                String tokenPassager = reservation.getPassager().getExpoPushToken();
                String villeDepart = reservation.getTrajet().getVilleDepart();
                String villeArrivee = reservation.getTrajet().getVilleArrivee();

                notificationService.envoyerNotification(
                    tokenPassager,
                    "Votre trajet part bientot",
                    "Votre trajet " + villeDepart + " → " + villeArrivee + " part dans 30 minutes. Preparez-vous !"
                );

                // Marque comme envoyee pour ne pas renvoyer
                reservation.setNotificationDepartEnvoyee(true);
                reservationRepository.save(reservation);

                log.info("Alerte envoyee pour reservation {}", reservation.getId());

            } catch (Exception e) {
                log.error("Erreur alerte reservation {}: {}", reservation.getId(), e.getMessage());
            }
        }
    }
}