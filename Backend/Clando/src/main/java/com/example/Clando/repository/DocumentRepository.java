package com.example.Clando.repository;

import com.example.Clando.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByUtilisateurId(Long utilisateurId);
    List<Document> findByStatut(Document.StatutDocument statut);
    boolean existsByUtilisateurIdAndType(Long utilisateurId, Document.TypeDocument type);
}