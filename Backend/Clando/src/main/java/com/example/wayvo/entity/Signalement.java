package com.example.wayvo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "signalements")
public class Signalement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeSignalement type;

    @Column(nullable = false, length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutSignalement statut = StatutSignalement.OUVERT;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @ManyToOne
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dateSignalement;

    @Column
    private String reponseAdmin;

    @PrePersist
    protected void onCreate() {
        this.dateSignalement = LocalDateTime.now();
    }

    public enum TypeSignalement {
        PROBLEME_TECHNIQUE,
        COMPORTEMENT_INAPPROPRIE,
        ARNAQUE,
        TRAJET_ANNULE,
        AUTRE
    }

    public enum StatutSignalement {
        OUVERT, EN_COURS, RESOLU, FERME
    }

    public Signalement() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public TypeSignalement getType() { return type; }
    public void setType(TypeSignalement type) { this.type = type; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public StatutSignalement getStatut() { return statut; }
    public void setStatut(StatutSignalement statut) { this.statut = statut; }

    public Utilisateur getUtilisateur() { return utilisateur; }
    public void setUtilisateur(Utilisateur utilisateur) { this.utilisateur = utilisateur; }

    public Reservation getReservation() { return reservation; }
    public void setReservation(Reservation reservation) { this.reservation = reservation; }

    public LocalDateTime getDateSignalement() { return dateSignalement; }

    public String getReponseAdmin() { return reponseAdmin; }
    public void setReponseAdmin(String reponseAdmin) { this.reponseAdmin = reponseAdmin; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final Signalement s = new Signalement();
        public Builder type(TypeSignalement v) { s.type = v; return this; }
        public Builder description(String v) { s.description = v; return this; }
        public Builder utilisateur(Utilisateur v) { s.utilisateur = v; return this; }
        public Builder reservation(Reservation v) { s.reservation = v; return this; }
        public Signalement build() { return s; }
    }
}