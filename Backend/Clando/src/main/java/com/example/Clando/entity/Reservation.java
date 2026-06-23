package com.example.Clando.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservations")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private LocalDate dateReservation;

    @Min(1)
    @Column(nullable = false)
    private int nbPlaces;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutReservation statut = StatutReservation.EN_ATTENTE;

    @ManyToOne
    @JoinColumn(name = "passager_id", nullable = false)
    private Utilisateur passager;

    @ManyToOne
    @JoinColumn(name = "trajet_id", nullable = false)
    private Trajet trajet;

    @OneToOne(mappedBy = "reservation", cascade = CascadeType.ALL)
    private Paiement paiement;

    @Column
    private String djomyTransactionId;

    @Column
    private String statutPaiement;

    @Column
    private String numeroTelephone;

    @Column
    private String urlPaiement;

    @Column
    private Double prixPropose;

    @Column(nullable = false)
    private int nbTentatives = 0;

    @Column(nullable = false)
    private boolean notificationDepartEnvoyee = false;

    @Column
    private LocalDateTime dateConfirmation;

    @Column
    private String departPassager;

    @Column
    private String arriveePassager;

    public enum StatutReservation {
        EN_ATTENTE, CONFIRMEE, ANNULEE, REFUSEE, PRIX_REFUSE, TERMINEE
    }

    @PrePersist
    protected void onCreate() {
        this.dateReservation = LocalDate.now();
    }

    public Reservation() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDate getDateReservation() { return dateReservation; }
    public void setDateReservation(LocalDate dateReservation) { this.dateReservation = dateReservation; }

    public int getNbPlaces() { return nbPlaces; }
    public void setNbPlaces(int nbPlaces) { this.nbPlaces = nbPlaces; }

    public StatutReservation getStatut() { return statut; }
    public void setStatut(StatutReservation statut) { this.statut = statut; }

    public Utilisateur getPassager() { return passager; }
    public void setPassager(Utilisateur passager) { this.passager = passager; }

    public Trajet getTrajet() { return trajet; }
    public void setTrajet(Trajet trajet) { this.trajet = trajet; }

    public Paiement getPaiement() { return paiement; }
    public void setPaiement(Paiement paiement) { this.paiement = paiement; }

    public Double getPrixPropose() { return prixPropose; }
    public void setPrixPropose(Double prixPropose) { this.prixPropose = prixPropose; }

    public int getNbTentatives() { return nbTentatives; }
    public void setNbTentatives(int nbTentatives) { this.nbTentatives = nbTentatives; }

    public String getDjomyTransactionId() { return djomyTransactionId; }
    public void setDjomyTransactionId(String djomyTransactionId) { this.djomyTransactionId = djomyTransactionId; }

    public String getStatutPaiement() { return statutPaiement; }
    public void setStatutPaiement(String statutPaiement) { this.statutPaiement = statutPaiement; }

    public String getNumeroTelephone() { return numeroTelephone; }
    public void setNumeroTelephone(String numeroTelephone) { this.numeroTelephone = numeroTelephone; }

    public String getUrlPaiement() { return urlPaiement; }
    public void setUrlPaiement(String urlPaiement) { this.urlPaiement = urlPaiement; }

    public boolean isNotificationDepartEnvoyee() { return notificationDepartEnvoyee; }
    public void setNotificationDepartEnvoyee(boolean v) { this.notificationDepartEnvoyee = v; }

    public LocalDateTime getDateConfirmation() { return dateConfirmation; }
    public void setDateConfirmation(LocalDateTime v) { this.dateConfirmation = v; }

    public String getDepartPassager() { return departPassager; }
    public void setDepartPassager(String v) { this.departPassager = v; }

    public String getArriveePassager() { return arriveePassager; }
    public void setArriveePassager(String v) { this.arriveePassager = v; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final Reservation r = new Reservation();
        public Builder nbPlaces(int val) { r.nbPlaces = val; return this; }
        public Builder statut(StatutReservation val) { r.statut = val; return this; }
        public Builder passager(Utilisateur val) { r.passager = val; return this; }
        public Builder trajet(Trajet val) { r.trajet = val; return this; }
        public Reservation build() { return r; }
    }
}