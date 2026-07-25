package com.example.wayvo.dtos.request;

import com.example.wayvo.entity.Paiement;

import jakarta.validation.constraints.*;

public class PaiementRequest {

    @NotNull(message = "La méthode de paiement est obligatoire")
    private Paiement.MethodePaiement methode;

    @NotNull(message = "L'id de la réservation est obligatoire")
    private Long reservationId;

    private String referenceTransaction;

    public PaiementRequest() {}

    public Paiement.MethodePaiement getMethode() { return methode; }
    public void setMethode(Paiement.MethodePaiement methode) { this.methode = methode; }

    public Long getReservationId() { return reservationId; }
    public void setReservationId(Long reservationId) { this.reservationId = reservationId; }

    public String getReferenceTransaction() { return referenceTransaction; }
    public void setReferenceTransaction(String referenceTransaction) { this.referenceTransaction = referenceTransaction; }
}