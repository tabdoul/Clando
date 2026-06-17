package com.example.Clando.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "paiements")
public class Paiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @DecimalMin("0.0")
    @Column(nullable = false)
    private double montant;

    @Column(nullable = false, updatable = false)
    private LocalDateTime datePaiement;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MethodePaiement methode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutPaiement statut = StatutPaiement.EN_ATTENTE;

    @Column
    private String referenceTransaction;

    @OneToOne
    @JoinColumn(name = "reservation_id", nullable = false, unique = true)
    private Reservation reservation;

    public enum MethodePaiement {
        CARTE, VIREMENT, PAYPAL, ESPECES
    }

    public enum StatutPaiement {
        EN_ATTENTE, EFFECTUE, REMBOURSE, ECHOUE
    }

    @PrePersist
    protected void onCreate() {
        this.datePaiement = LocalDateTime.now();
    }

    public Paiement() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public double getMontant() { return montant; }
    public void setMontant(double montant) { this.montant = montant; }

    public LocalDateTime getDatePaiement() { return datePaiement; }
    public void setDatePaiement(LocalDateTime datePaiement) { this.datePaiement = datePaiement; }

    public MethodePaiement getMethode() { return methode; }
    public void setMethode(MethodePaiement methode) { this.methode = methode; }

    public StatutPaiement getStatut() { return statut; }
    public void setStatut(StatutPaiement statut) { this.statut = statut; }

    public String getReferenceTransaction() { return referenceTransaction; }
    public void setReferenceTransaction(String referenceTransaction) { this.referenceTransaction = referenceTransaction; }

    public Reservation getReservation() { return reservation; }
    public void setReservation(Reservation reservation) { this.reservation = reservation; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final Paiement p = new Paiement();
        public Builder montant(double val) { p.montant = val; return this; }
        public Builder methode(MethodePaiement val) { p.methode = val; return this; }
        public Builder statut(StatutPaiement val) { p.statut = val; return this; }
        public Builder referenceTransaction(String val) { p.referenceTransaction = val; return this; }
        public Builder reservation(Reservation val) { p.reservation = val; return this; }
        public Paiement build() { return p; }
    }
}