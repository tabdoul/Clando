package com.example.Clando.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.Clando.entity.Trajet;

@Repository
public interface TrajetRepository extends JpaRepository<Trajet, Long> {

    List<Trajet> findByConducteurId(Long conducteurId);

    long countByConducteurIdAndDateCreationBetween(
        Long conducteurId,
        LocalDateTime debut,
        LocalDateTime fin
    );

    @Query("SELECT t FROM Trajet t WHERE " +
        "LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(t.villeDepart, 'é', 'e'), 'è', 'e'), 'ê', 'e'), 'à', 'a'), 'â', 'a')) " +
        "LIKE LOWER(CONCAT('%', :villeDepart, '%')) AND " +
        "LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(t.villeArrivee, 'é', 'e'), 'è', 'e'), 'ê', 'e'), 'à', 'a'), 'â', 'a')) " +
        "LIKE LOWER(CONCAT('%', :villeArrivee, '%')) AND " +
        "t.dateHeureDepart >= :date AND " +
        "t.statut = com.example.Clando.entity.Trajet.StatutTrajet.OUVERT")
    Page<Trajet> findByVilleDepartAndVilleArriveeIgnoreCase(
        @Param("villeDepart") String villeDepart,
        @Param("villeArrivee") String villeArrivee,
        @Param("date") LocalDateTime date,
        Pageable pageable
    );
}