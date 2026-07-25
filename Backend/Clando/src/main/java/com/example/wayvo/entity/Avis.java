package com.example.wayvo.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

@Entity
@Table(name = "avis")
public class Avis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Min(1) @Max(5)
    @Column(nullable = false)
    private int note;

    @Size(max = 500)
    private String commentaire;

    @Column(nullable = false, updatable = false)
    private LocalDate dateAvis;

    @ManyToOne
    @JoinColumn(name = "auteur_id", nullable = false)
    private Utilisateur auteur;

    @ManyToOne
    @JoinColumn(name = "destinataire_id", nullable = false)
    private Utilisateur destinataire;

    @ManyToOne
    @JoinColumn(name = "trajet_id", nullable = false)
    private Trajet trajet;

    @PrePersist
    protected void onCreate() {
        this.dateAvis = LocalDate.now();
    }

    public Avis() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public int getNote() { return note; }
    public void setNote(int note) { this.note = note; }

    public String getCommentaire() { return commentaire; }
    public void setCommentaire(String commentaire) { this.commentaire = commentaire; }

    public LocalDate getDateAvis() { return dateAvis; }
    public void setDateAvis(LocalDate dateAvis) { this.dateAvis = dateAvis; }

    public Utilisateur getAuteur() { return auteur; }
    public void setAuteur(Utilisateur auteur) { this.auteur = auteur; }

    public Utilisateur getDestinataire() { return destinataire; }
    public void setDestinataire(Utilisateur destinataire) { this.destinataire = destinataire; }

    public Trajet getTrajet() { return trajet; }
    public void setTrajet(Trajet trajet) { this.trajet = trajet; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final Avis a = new Avis();
        public Builder note(int val) { a.note = val; return this; }
        public Builder commentaire(String val) { a.commentaire = val; return this; }
        public Builder auteur(Utilisateur val) { a.auteur = val; return this; }
        public Builder destinataire(Utilisateur val) { a.destinataire = val; return this; }
        public Builder trajet(Trajet val) { a.trajet = val; return this; }
        public Avis build() { return a; }
    }
}