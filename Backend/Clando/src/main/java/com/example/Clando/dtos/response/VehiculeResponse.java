package com.example.Clando.dtos.response;

public class VehiculeResponse {

    private Long id;
    private String marque;
    private String modele;
    private String immatriculation;
    private int nbPlaces;
    private Long conducteurId;
    private String conducteurNom;
    private String conducteurPrenom;

    public VehiculeResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public String getConducteurNom() { return conducteurNom; }
    public void setConducteurNom(String conducteurNom) { this.conducteurNom = conducteurNom; }

    public String getConducteurPrenom() { return conducteurPrenom; }
    public void setConducteurPrenom(String conducteurPrenom) { this.conducteurPrenom = conducteurPrenom; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final VehiculeResponse r = new VehiculeResponse();
        public Builder id(Long val) { r.id = val; return this; }
        public Builder marque(String val) { r.marque = val; return this; }
        public Builder modele(String val) { r.modele = val; return this; }
        public Builder immatriculation(String val) { r.immatriculation = val; return this; }
        public Builder nbPlaces(int val) { r.nbPlaces = val; return this; }
        public Builder conducteurId(Long val) { r.conducteurId = val; return this; }
        public Builder conducteurNom(String val) { r.conducteurNom = val; return this; }
        public Builder conducteurPrenom(String val) { r.conducteurPrenom = val; return this; }
        public VehiculeResponse build() { return r; }
    }
}