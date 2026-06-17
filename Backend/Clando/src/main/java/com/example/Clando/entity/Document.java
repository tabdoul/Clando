package com.example.Clando.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeDocument type;

    @Column(nullable = false)
    private String cheminFichier;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutDocument statut = StatutDocument.EN_ATTENTE;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dateUpload;

    @Column
    private String commentaireAdmin;

    @PrePersist
    protected void onCreate() {
        this.dateUpload = LocalDateTime.now();
    }

    public enum TypeDocument {
        CNI, PASSEPORT, PERMIS_CONDUIRE, CERTIFICAT_IMMATRICULATION
    }

    public enum StatutDocument {
        EN_ATTENTE, VALIDE, REJETE
    }

    public Document() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public TypeDocument getType() { return type; }
    public void setType(TypeDocument type) { this.type = type; }

    public String getCheminFichier() { return cheminFichier; }
    public void setCheminFichier(String cheminFichier) { this.cheminFichier = cheminFichier; }

    public StatutDocument getStatut() { return statut; }
    public void setStatut(StatutDocument statut) { this.statut = statut; }

    public Utilisateur getUtilisateur() { return utilisateur; }
    public void setUtilisateur(Utilisateur utilisateur) { this.utilisateur = utilisateur; }

    public LocalDateTime getDateUpload() { return dateUpload; }

    public String getCommentaireAdmin() { return commentaireAdmin; }
    public void setCommentaireAdmin(String commentaireAdmin) { this.commentaireAdmin = commentaireAdmin; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final Document d = new Document();
        public Builder type(TypeDocument v) { d.type = v; return this; }
        public Builder cheminFichier(String v) { d.cheminFichier = v; return this; }
        public Builder utilisateur(Utilisateur v) { d.utilisateur = v; return this; }
        public Document build() { return d; }
    }
}