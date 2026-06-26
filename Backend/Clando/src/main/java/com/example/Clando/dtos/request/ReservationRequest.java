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
    private String numeroTelephone;

    @NotBlank(message = "Le point de depart du passager est obligatoire")
    private String departPassager;

    @NotBlank(message = "Le point d'arrivee du passager est obligatoire")
    private String arriveePassager;

    public ReservationRequest() {}

    public int getNbPlaces() { return nbPlaces; }
    public void setNbPlaces(int nbPlaces) { this.nbPlaces = nbPlaces; }

    public Long getPassagerId() { return passagerId; }
    public void setPassagerId(Long passagerId) { this.passagerId = passagerId; }

    public Long getTrajetId() { return trajetId; }
    public void setTrajetId(Long trajetId) { this.trajetId = trajetId; }

    public Double getPrixPropose() { return prixPropose; }
    public void setPrixPropose(Double prixPropose) { this.prixPropose = prixPropose; }

    public String getNumeroTelephone() { return numeroTelephone; }
    public void setNumeroTelephone(String numeroTelephone) { this.numeroTelephone = numeroTelephone; }

    public String getDepartPassager() { return departPassager; }
    public void setDepartPassager(String v) { this.departPassager = v; }

    public String getArriveePassager() { return arriveePassager; }
    public void setArriveePassager(String v) { this.arriveePassager = v; }
}