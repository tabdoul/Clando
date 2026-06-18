package com.example.Clando.repository;

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

    @Query("SELECT r FROM Reservation r WHERE r.trajet.conducteur.id = :conducteurId AND r.statut = com.example.Clando.entity.Reservation.StatutReservation.EN_ATTENTE")
    List<Reservation> findReservationsEnAttenteParConducteur(@Param("conducteurId") Long conducteurId);
    List<Reservation> findByDjomyTransactionId(String djomyTransactionId);
}