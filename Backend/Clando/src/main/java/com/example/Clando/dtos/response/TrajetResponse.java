package com.example.Clando.dtos.response;

import java.time.LocalDateTime;
import com.example.Clando.entity.Trajet;

public class TrajetResponse {

    private Long id;
    private String villeDepart;
    private String villeArrivee;
    private LocalDateTime dateHeureDepart;
    private int placesDisponibles;
    private double prix;
    private String itineraire;
    private Trajet.StatutTrajet statut;
    private Long conducteurId;
    private String conducteurNom;
    private String conducteurPrenom;
    private String conducteurPhoto;
    private Long vehiculeId;
    private String vehiculeMarque;
    private String vehiculeModele;
    private Double noteMoyenneConducteur;
    private Long nbTrajetsTerminesConducteur;
    private String conducteurGenre;
    private boolean femmesUniquement;


    public TrajetResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getVilleDepart() { return villeDepart; }
    public void setVilleDepart(String villeDepart) { this.villeDepart = villeDepart; }

    public String getVilleArrivee() { return villeArrivee; }
    public void setVilleArrivee(String villeArrivee) { this.villeArrivee = villeArrivee; }

    public LocalDateTime getDateHeureDepart() { return dateHeureDepart; }
    public void setDateHeureDepart(LocalDateTime dateHeureDepart) { this.dateHeureDepart = dateHeureDepart; }

    public int getPlacesDisponibles() { return placesDisponibles; }
    public void setPlacesDisponibles(int placesDisponibles) { this.placesDisponibles = placesDisponibles; }

    public double getPrix() { return prix; }
    public void setPrix(double prix) { this.prix = prix; }

    public String getItineraire() { return itineraire; }
    public void setItineraire(String itineraire) { this.itineraire = itineraire; }

    public Trajet.StatutTrajet getStatut() { return statut; }
    public void setStatut(Trajet.StatutTrajet statut) { this.statut = statut; }

    public Long getConducteurId() { return conducteurId; }
    public void setConducteurId(Long conducteurId) { this.conducteurId = conducteurId; }

    public String getConducteurNom() { return conducteurNom; }
    public void setConducteurNom(String conducteurNom) { this.conducteurNom = conducteurNom; }

    public String getConducteurPrenom() { return conducteurPrenom; }
    public void setConducteurPrenom(String conducteurPrenom) { this.conducteurPrenom = conducteurPrenom; }

    public String getConducteurPhoto() { return conducteurPhoto; }
    public void setConducteurPhoto(String conducteurPhoto) { this.conducteurPhoto = conducteurPhoto; }

    public Long getVehiculeId() { return vehiculeId; }
    public void setVehiculeId(Long vehiculeId) { this.vehiculeId = vehiculeId; }

    public String getVehiculeMarque() { return vehiculeMarque; }
    public void setVehiculeMarque(String vehiculeMarque) { this.vehiculeMarque = vehiculeMarque; }

    public String getVehiculeModele() { return vehiculeModele; }
    public void setVehiculeModele(String vehiculeModele) { this.vehiculeModele = vehiculeModele; }

    public Double getNoteMoyenneConducteur() { return noteMoyenneConducteur; }
    public void setNoteMoyenneConducteur(Double v) { this.noteMoyenneConducteur = v; }

    public Long getNbTrajetsTerminesConducteur() { return nbTrajetsTerminesConducteur; }
    public void setNbTrajetsTerminesConducteur(Long v) { this.nbTrajetsTerminesConducteur = v; }

    public String getConducteurGenre() { return conducteurGenre; }
    public void setConducteurGenre(String v) { this.conducteurGenre = v; }

    public boolean isFemmesUniquement() { return femmesUniquement; }
    public void setFemmesUniquement(boolean v) { this.femmesUniquement = v; }


    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final TrajetResponse r = new TrajetResponse();
        public Builder id(Long val) { r.id = val; return this; }
        public Builder villeDepart(String val) { r.villeDepart = val; return this; }
        public Builder villeArrivee(String val) { r.villeArrivee = val; return this; }
        public Builder dateHeureDepart(LocalDateTime val) { r.dateHeureDepart = val; return this; }
        public Builder placesDisponibles(int val) { r.placesDisponibles = val; return this; }
        public Builder prix(double val) { r.prix = val; return this; }
        public Builder itineraire(String val) { r.itineraire = val; return this; }
        public Builder statut(Trajet.StatutTrajet val) { r.statut = val; return this; }
        public Builder conducteurId(Long val) { r.conducteurId = val; return this; }
        public Builder conducteurNom(String val) { r.conducteurNom = val; return this; }
        public Builder conducteurPrenom(String val) { r.conducteurPrenom = val; return this; }
        public Builder conducteurPhoto(String val) { r.conducteurPhoto = val; return this; }
        public Builder vehiculeId(Long val) { r.vehiculeId = val; return this; }
        public Builder vehiculeMarque(String val) { r.vehiculeMarque = val; return this; }
        public Builder vehiculeModele(String val) { r.vehiculeModele = val; return this; }
        public Builder noteMoyenneConducteur(Double val) { r.noteMoyenneConducteur = val; return this; }
        public Builder nbTrajetsTerminesConducteur(Long val) { r.nbTrajetsTerminesConducteur = val; return this; }
        
        public Builder conducteurGenre(String val) { r.conducteurGenre = val; return this; }
        public Builder femmesUniquement(boolean val) { r.femmesUniquement = val; return this; }
        public TrajetResponse build() { return r; }
    }
}