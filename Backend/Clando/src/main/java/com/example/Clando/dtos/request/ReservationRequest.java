package com.example.Clando.dtos.request;

import jakarta.validation.constraints.*;

public class ReservationRequest {

    @Min(value = 1, message = "Il faut réserver au moins 1 place")
    private int nbPlaces;

    @NotNull(message = "L'id du passager est obligatoire")
    private Long passagerId;

    @NotNull(message = "L'id du trajet est obligatoire")
    private Long trajetId;
    private Double prixPropose;

    public ReservationRequest() {}

    public int getNbPlaces() { return nbPlaces; }
    public void setNbPlaces(int nbPlaces) { this.nbPlaces = nbPlaces; }

    public Long getPassagerId() { return passagerId; }
    public void setPassagerId(Long passagerId) { this.passagerId = passagerId; }

    public Long getTrajetId() { return trajetId; }
    public void setTrajetId(Long trajetId) { this.trajetId = trajetId; }
    public Double getPrixPropose() { return prixPropose; }
    public void setPrixPropose(Double prixPropose) { this.prixPropose = prixPropose; }
}