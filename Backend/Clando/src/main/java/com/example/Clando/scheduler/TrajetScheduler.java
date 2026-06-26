package com.example.Clando.scheduler;

import com.example.Clando.entity.Reservation;
import com.example.Clando.entity.Trajet;
import com.example.Clando.repository.ReservationRepository;
import com.example.Clando.repository.TrajetRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

@Component
public class TrajetScheduler {

    private final TrajetRepository trajetRepository;
    private final ReservationRepository reservationRepository;

    public TrajetScheduler(TrajetRepository trajetRepository,
                           ReservationRepository reservationRepository) {
        this.trajetRepository = trajetRepository;
        this.reservationRepository = reservationRepository;
    }

    // Tourne toutes les heures
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

            // Passer les réservations confirmées en TERMINEE
            List<Reservation> reservations = reservationRepository.findByTrajetId(trajet.getId());
            for (Reservation reservation : reservations) {
                if (reservation.getStatut() == Reservation.StatutReservation.CONFIRMEE) {
                    reservation.setStatut(Reservation.StatutReservation.TERMINEE);
                    reservationRepository.save(reservation);
                }
                // Annuler les réservations EN_ATTENTE non confirmées
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
}