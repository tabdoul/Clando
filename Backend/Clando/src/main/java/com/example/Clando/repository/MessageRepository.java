package com.example.Clando.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.Clando.entity.Message;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByReservationIdOrderByDateEnvoiAsc(Long reservationId);

    List<Message> findByDestinataireIdOrExpediteurIdOrderByDateEnvoiDesc(
            Long destinataireId, Long expediteurId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.destinataire.id = :userId AND m.lu = false")
    Long countMessagesNonLus(@Param("userId") Long userId);

    List<Message> findByReservationIdAndDestinataireIdAndLuFalse(
            Long reservationId, Long destinataireId);
}