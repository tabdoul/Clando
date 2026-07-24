package com.example.Clando.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.Clando.entity.Reservation;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByPassagerId(Long passagerId);
    List<Reservation> findByTrajetId(Long trajetId);
    boolean existsByPassagerIdAndTrajetId(Long passagerId, Long trajetId);
    List<Reservation> findByDjomyTransactionId(String djomyTransactionId);
    long countByPassagerId(Long passagerId);

   @Query("SELECT r FROM Reservation r WHERE r.trajet.conducteur.id = :conducteurId " +
       "AND r.statut = com.example.Clando.entity.Reservation.StatutReservation.CONFIRMEE")
List<Reservation> findReservationsConfirmeesParConducteur(@Param("conducteurId") Long conducteurId);


  @Query("SELECT r FROM Reservation r WHERE r.trajet.id = :trajetId " +
       "AND r.statut = com.example.Clando.entity.Reservation.StatutReservation.CONFIRMEE")
List<Reservation> findPassagersConfirmes(@Param("trajetId") Long trajetId);

    @Query("SELECT r FROM Reservation r " +
           "WHERE r.statut = com.example.Clando.entity.Reservation.StatutReservation.CONFIRMEE " +
           "AND r.notificationDepartEnvoyee = false " +
           "AND r.trajet.dateHeureDepart BETWEEN :debut AND :fin")
    List<Reservation> findReservationsANotifier(
        @Param("debut") LocalDateTime debut,
        @Param("fin") LocalDateTime fin
    );

    @Query("SELECT r FROM Reservation r " +
           "WHERE r.statut = com.example.Clando.entity.Reservation.StatutReservation.CONFIRMEE " +
           "AND (r.statutPaiement IS NULL OR r.statutPaiement != 'SUCCESS') " +
           "AND r.dateConfirmation IS NOT NULL " +
           "AND r.dateConfirmation < :limite")
    List<Reservation> findReservationsNonPayeesExpired(@Param("limite") LocalDateTime limite);
    @Query("SELECT r FROM Reservation r WHERE r.trajet.conducteur.id = :conducteurId " +
       "AND r.statut IN (" +
       "com.example.Clando.entity.Reservation.StatutReservation.EN_ATTENTE, " +
       "com.example.Clando.entity.Reservation.StatutReservation.PRIX_REFUSE, " +
       "com.example.Clando.entity.Reservation.StatutReservation.CONTRE_OFFRE)")
List<Reservation> findReservationsEnAttenteParConducteur(@Param("conducteurId") Long conducteurId);

    @Query("SELECT r FROM Reservation r " +
           "WHERE r.statut = com.example.Clando.entity.Reservation.StatutReservation.EN_ATTENTE " +
           "AND r.trajet.dateHeureDepart <= :maintenant")
    List<Reservation> findDemandesEnAttenteDepartPasse(@Param("maintenant") LocalDateTime maintenant);
}