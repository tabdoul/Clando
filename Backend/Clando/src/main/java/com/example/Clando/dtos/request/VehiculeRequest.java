package com.example.Clando.dtos.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class VehiculeRequest {

    @NotBlank(message = "La marque est obligatoire")
    private String marque;

    @NotBlank(message = "Le modèle est obligatoire")
    private String modele;

    @NotBlank(message = "L'immatriculation est obligatoire")
    private String immatriculation;

    @Min(value = 1, message = "Le nombre de places doit être au moins 1")
    @Max(value = 9, message = "Le nombre de places ne peut pas dépasser 9")
    private int nbPlaces;

    @NotNull(message = "L'id du conducteur est obligatoire")
    private Long conducteurId;

    public VehiculeRequest() {}

    public String getMarque() { return marque; }
    public void setMarque(String marque) { this.marque = marque; }

    public String getModele() { return modele; }
    public void setModele(String modele) { this.modele = modele; }

    public String getImmatriculation() { return immatriculation; }
    public void setImmatriculation(String immatriculation) { this.immatriculation = immatriculation; }

    public int getNbPlaces() { return nbPlaces; }
    public void setNbPlaces(int nbPlaces) { this.nbPlaces = nbPlaces; }

    public Long getConducteurId() { return conducteurId; }
    public void setConducteurId(Long conducteurId) { this.conducteurId = conducteurId; }
}