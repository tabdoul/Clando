package com.example.wayvo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.wayvo.entity.Message;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByReservationIdOrderByDateEnvoiAsc(Long reservationId);

    List<Message> findByDestinataireIdOrExpediteurIdOrderByDateEnvoiDesc(
            Long destinataireId, Long expediteurId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.destinataire.id = :userId AND m.lu = false")
    Long countMessagesNonLus(@Param("userId") Long userId);

    List<Message> findByReservationIdAndDestinataireIdAndLuFalse(
            Long reservationId, Long destinataireId);

    //  Historique d'une conversation entre deux utilisateurs SANS reservation
    // (contact d'un conducteur avant toute reservation)
    @Query("SELECT m FROM Message m WHERE m.reservation IS NULL " +
           "AND ((m.expediteur.id = :userId1 AND m.destinataire.id = :userId2) " +
           "OR (m.expediteur.id = :userId2 AND m.destinataire.id = :userId1)) " +
           "ORDER BY m.dateEnvoi ASC")
    List<Message> findConversationSansReservation(
            @Param("userId1") Long userId1, @Param("userId2") Long userId2);

    List<Message> findByReservationIsNullAndDestinataireIdAndExpediteurIdAndLuFalse(
            Long destinataireId, Long expediteurId);
}