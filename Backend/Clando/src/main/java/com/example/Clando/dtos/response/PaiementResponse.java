package com.example.Clando.dtos.response;

import com.example.Clando.entity.Paiement;
import java.time.LocalDateTime;

public class PaiementResponse {

    private Long id;
    private double montant;
    private LocalDateTime datePaiement;
    private Paiement.MethodePaiement methode;
    private Paiement.StatutPaiement statut;
    private String referenceTransaction;
    private Long reservationId;

    public PaiementResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public double getMontant() { return montant; }
    public void setMontant(double montant) { this.montant = montant; }

    public LocalDateTime getDatePaiement() { return datePaiement; }
    public void setDatePaiement(LocalDateTime datePaiement) { this.datePaiement = datePaiement; }

    public Paiement.MethodePaiement getMethode() { return methode; }
    public void setMethode(Paiement.MethodePaiement methode) { this.methode = methode; }

    public Paiement.StatutPaiement getStatut() { return statut; }
    public void setStatut(Paiement.StatutPaiement statut) { this.statut = statut; }

    public String getReferenceTransaction() { return referenceTransaction; }
    public void setReferenceTransaction(String referenceTransaction) { this.referenceTransaction = referenceTransaction; }

    public Long getReservationId() { return reservationId; }
    public void setReservationId(Long reservationId) { this.reservationId = reservationId; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final PaiementResponse r = new PaiementResponse();
        public Builder id(Long val) { r.id = val; return this; }
        public Builder montant(double val) { r.montant = val; return this; }
        public Builder datePaiement(LocalDateTime val) { r.datePaiement = val; return this; }
        public Builder methode(Paiement.MethodePaiement val) { r.methode = val; return this; }
        public Builder statut(Paiement.StatutPaiement val) { r.statut = val; return this; }
        public Builder referenceTransaction(String val) { r.referenceTransaction = val; return this; }
        public Builder reservationId(Long val) { r.reservationId = val; return this; }
        public PaiementResponse build() { return r; }
    }
}