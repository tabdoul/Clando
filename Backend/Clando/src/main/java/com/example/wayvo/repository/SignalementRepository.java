package com.example.wayvo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.wayvo.entity.Signalement;

import java.util.List;

@Repository
public interface SignalementRepository extends JpaRepository<Signalement, Long> {
    List<Signalement> findByUtilisateurIdOrderByDateSignalementDesc(Long utilisateurId);
    List<Signalement> findByStatutOrderByDateSignalementDesc(Signalement.StatutSignalement statut);
    long countByStatut(Signalement.StatutSignalement statut);
}