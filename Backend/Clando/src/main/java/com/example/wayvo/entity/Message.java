package com.example.wayvo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 1000)
    private String contenu;

    @ManyToOne
    @JoinColumn(name = "expediteur_id", nullable = false)
    private Utilisateur expediteur;

    @ManyToOne
    @JoinColumn(name = "destinataire_id", nullable = false)
    private Utilisateur destinataire;

    @ManyToOne
    @JoinColumn(name = "reservation_id", nullable = false)
    private Reservation reservation;

    @Column(nullable = false)
    private LocalDateTime dateEnvoi;

    @Column(nullable = false)
    private boolean lu = false;

    @PrePersist
    protected void onCreate() {
        this.dateEnvoi = LocalDateTime.now();
    }

    public Message() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getContenu() { return contenu; }
    public void setContenu(String contenu) { this.contenu = contenu; }

    public Utilisateur getExpediteur() { return expediteur; }
    public void setExpediteur(Utilisateur expediteur) { this.expediteur = expediteur; }

    public Utilisateur getDestinataire() { return destinataire; }
    public void setDestinataire(Utilisateur destinataire) { this.destinataire = destinataire; }

    public Reservation getReservation() { return reservation; }
    public void setReservation(Reservation reservation) { this.reservation = reservation; }

    public LocalDateTime getDateEnvoi() { return dateEnvoi; }

    public boolean isLu() { return lu; }
    public void setLu(boolean lu) { this.lu = lu; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final Message m = new Message();
        public Builder contenu(String v) { m.contenu = v; return this; }
        public Builder expediteur(Utilisateur v) { m.expediteur = v; return this; }
        public Builder destinataire(Utilisateur v) { m.destinataire = v; return this; }
        public Builder reservation(Reservation v) { m.reservation = v; return this; }
        public Message build() { return m; }
    }
}