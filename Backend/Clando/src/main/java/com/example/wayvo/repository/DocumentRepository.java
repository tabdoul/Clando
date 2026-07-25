package com.example.wayvo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.wayvo.entity.Document;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByUtilisateurId(Long utilisateurId);
    List<Document> findByStatut(Document.StatutDocument statut);
    boolean existsByUtilisateurIdAndType(Long utilisateurId, Document.TypeDocument type);

    boolean existsByUtilisateurIdAndTypeInAndStatut(
        Long utilisateurId,
        List<Document.TypeDocument> types,
        Document.StatutDocument statut
    );
}