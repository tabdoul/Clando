package com.example.wayvo.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.wayvo.entity.Reservation;
import com.example.wayvo.entity.Trajet;
import com.example.wayvo.repository.ReservationRepository;
import com.example.wayvo.repository.TrajetRepository;
import com.example.wayvo.service.NotificationService;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

@Component
public class TrajetScheduler {

    private final TrajetRepository trajetRepository;
    private final ReservationRepository reservationRepository;
    private final NotificationService notificationService;

    public TrajetScheduler(TrajetRepository trajetRepository,
                           ReservationRepository reservationRepository,
                           NotificationService notificationService) {
        this.trajetRepository = trajetRepository;
        this.reservationRepository = reservationRepository;
        this.notificationService = notificationService;
    }

    //  Tourne toutes les heures — clôture les trajets expirés
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void cloturerTrajetsExpires() {
        LocalDateTime maintenant = ZonedDateTime
            .now(ZoneId.of("Africa/Conakry"))
            .toLocalDateTime();

        List<Trajet> trajetsExpires = trajetRepository.findAll().stream()
            .filter(t -> t.getStatut() == Trajet.StatutTrajet.OUVERT
                      || t.getStatut() == Trajet.StatutTrajet.COMPLET)
            .filter(t -> t.getDateHeureDepart().isBefore(maintenant))
            .toList();

        for (Trajet trajet : trajetsExpires) {
            trajet.setStatut(Trajet.StatutTrajet.TERMINE);
            trajetRepository.save(trajet);

            List<Reservation> reservations = reservationRepository.findByTrajetId(trajet.getId());
            for (Reservation reservation : reservations) {
                if (reservation.getStatut() == Reservation.StatutReservation.CONFIRMEE) {
                    reservation.setStatut(Reservation.StatutReservation.TERMINEE);
                    reservationRepository.save(reservation);
                }
                if (reservation.getStatut() == Reservation.StatutReservation.EN_ATTENTE
                 || reservation.getStatut() == Reservation.StatutReservation.PRIX_REFUSE
                 || reservation.getStatut() == Reservation.StatutReservation.CONTRE_OFFRE) {
                    reservation.setStatut(Reservation.StatutReservation.ANNULEE);
                    reservationRepository.save(reservation);
                }
            }
        }

        if (!trajetsExpires.isEmpty()) {
            System.out.println("[Scheduler] " + trajetsExpires.size() +
                " trajet(s) cloture(s) automatiquement.");
        }
    }

    //  Tourne toutes les minutes — notifie 30 min avant le départ
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void notifierDepartImminent() {
        LocalDateTime maintenant = ZonedDateTime
            .now(ZoneId.of("Africa/Conakry"))
            .toLocalDateTime();

        LocalDateTime dans30min = maintenant.plusMinutes(30);
        LocalDateTime dans31min = maintenant.plusMinutes(31);

        List<Reservation> reservations = reservationRepository
            .findReservationsANotifier(dans30min, dans31min);

        for (Reservation reservation : reservations) {
            //  Notification au passager
            String tokenPassager = reservation.getPassager().getExpoPushToken();
            if (tokenPassager != null && !tokenPassager.isBlank()) {
                notificationService.envoyerNotification(
                    tokenPassager,
                    "Votre trajet part dans 30 minutes !",
                    reservation.getTrajet().getVilleDepart() + " → " +
                    reservation.getTrajet().getVilleArrivee() +
                    " — Preparez-vous !"
                );
            }

            //  Notification au conducteur
            String tokenConducteur = reservation.getTrajet().getConducteur().getExpoPushToken();
            if (tokenConducteur != null && !tokenConducteur.isBlank()) {
                notificationService.envoyerNotification(
                    tokenConducteur,
                    "Depart dans 30 minutes !",
                    "Votre trajet " + reservation.getTrajet().getVilleDepart() +
                    " → " + reservation.getTrajet().getVilleArrivee() +
                    " part bientot."
                );
            }

            // Marquer comme notifié pour ne pas renvoyer
            reservation.setNotificationDepartEnvoyee(true);
            reservationRepository.save(reservation);
        }

        if (!reservations.isEmpty()) {
            System.out.println("[Scheduler] " + reservations.size() +
                " notification(s) de depart imminent envoyee(s).");
        }
    }
}