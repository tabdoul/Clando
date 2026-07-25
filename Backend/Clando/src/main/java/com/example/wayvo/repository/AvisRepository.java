package com.example.wayvo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.wayvo.entity.Avis;

import java.util.List;

@Repository
public interface AvisRepository extends JpaRepository<Avis, Long> {

    List<Avis> findByDestinataireIdOrderByDateAvisDesc(Long destinataireId);

    List<Avis> findByAuteurId(Long auteurId);

    boolean existsByAuteurIdAndTrajetId(Long auteurId, Long trajetId);

    @Query("SELECT AVG(a.note) FROM Avis a WHERE a.destinataire.id = :destinataireId")
    Double findNoteMoyenneByDestinataire(@Param("destinataireId") Long destinataireId);

    @Query("SELECT COUNT(t) FROM Trajet t WHERE t.conducteur.id = :conducteurId AND t.statut = com.example.wayvo.entity.Trajet.StatutTrajet.TERMINE")
    Long countTrajetsTerminesByConducteur(@Param("conducteurId") Long conducteurId);
}