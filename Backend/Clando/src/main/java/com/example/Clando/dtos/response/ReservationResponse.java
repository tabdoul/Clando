package com.example.Clando.dtos.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import com.example.Clando.entity.Reservation;

public class ReservationResponse {

    private Long id;
    private LocalDate dateReservation;
    private int nbPlaces;
    private Reservation.StatutReservation statut;
    private Long passagerId;
    private String passagerNom;
    private String passagerPrenom;
    private Long conducteurId;
    private String conducteurNom;
    private String conducteurPrenom;
    private Long trajetId;
    private String villeDepart;
    private String villeArrivee;
    private Double prixPropose;
    private Double prixConducteur; // 
    private int nbTentatives;
    private String passagerPhoto;
    private String djomyTransactionId;
    private String statutPaiement;
    private String urlPaiement;
    private String passagerTelephone;
    private boolean trajetDemarre;
    private Double latitudeConducteur;
    private Double longitudeConducteur;
    private LocalDateTime dateConfirmation;
    private double prix;
    private String departPassager;
    private String arriveePassager;
    private LocalDateTime dateHeureDepart;

    public ReservationResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDate getDateReservation() { return dateReservation; }
    public void setDateReservation(LocalDate dateReservation) { this.dateReservation = dateReservation; }

    public int getNbPlaces() { return nbPlaces; }
    public void setNbPlaces(int nbPlaces) { this.nbPlaces = nbPlaces; }

    public Reservation.StatutReservation getStatut() { return statut; }
    public void setStatut(Reservation.StatutReservation statut) { this.statut = statut; }

    public Long getPassagerId() { return passagerId; }
    public void setPassagerId(Long passagerId) { this.passagerId = passagerId; }

    public String getPassagerNom() { return passagerNom; }
    public void setPassagerNom(String passagerNom) { this.passagerNom = passagerNom; }

    public String getPassagerPrenom() { return passagerPrenom; }
    public void setPassagerPrenom(String passagerPrenom) { this.passagerPrenom = passagerPrenom; }

    public Long getConducteurId() { return conducteurId; }
    public void setConducteurId(Long conducteurId) { this.conducteurId = conducteurId; }

    public String getConducteurNom() { return conducteurNom; }
    public void setConducteurNom(String conducteurNom) { this.conducteurNom = conducteurNom; }

    public String getConducteurPrenom() { return conducteurPrenom; }
    public void setConducteurPrenom(String conducteurPrenom) { this.conducteurPrenom = conducteurPrenom; }

    public Long getTrajetId() { return trajetId; }
    public void setTrajetId(Long trajetId) { this.trajetId = trajetId; }

    public String getVilleDepart() { return villeDepart; }
    public void setVilleDepart(String villeDepart) { this.villeDepart = villeDepart; }

    public String getVilleArrivee() { return villeArrivee; }
    public void setVilleArrivee(String villeArrivee) { this.villeArrivee = villeArrivee; }

    public Double getPrixPropose() { return prixPropose; }
    public void setPrixPropose(Double prixPropose) { this.prixPropose = prixPropose; }

    public Double getPrixConducteur() { return prixConducteur; } // 
    public void setPrixConducteur(Double v) { this.prixConducteur = v; } // 

    public LocalDateTime getDateHeureDepart() { return dateHeureDepart; }
    public void setDateHeureDepart(LocalDateTime v) { this.dateHeureDepart = v; }

    public int getNbTentatives() { return nbTentatives; }
    public void setNbTentatives(int nbTentatives) { this.nbTentatives = nbTentatives; }

    public String getPassagerPhoto() { return passagerPhoto; }
    public void setPassagerPhoto(String passagerPhoto) { this.passagerPhoto = passagerPhoto; }

    public String getDjomyTransactionId() { return djomyTransactionId; }
    public void setDjomyTransactionId(String djomyTransactionId) { this.djomyTransactionId = djomyTransactionId; }

    public String getStatutPaiement() { return statutPaiement; }
    public void setStatutPaiement(String statutPaiement) { this.statutPaiement = statutPaiement; }

    public String getUrlPaiement() { return urlPaiement; }
    public void setUrlPaiement(String urlPaiement) { this.urlPaiement = urlPaiement; }

    public String getPassagerTelephone() { return passagerTelephone; }
    public void setPassagerTelephone(String v) { this.passagerTelephone = v; }

    public boolean isTrajetDemarre() { return trajetDemarre; }
    public void setTrajetDemarre(boolean v) { this.trajetDemarre = v; }

    public Double getLatitudeConducteur() { return latitudeConducteur; }
    public void setLatitudeConducteur(Double v) { this.latitudeConducteur = v; }

    public Double getLongitudeConducteur() { return longitudeConducteur; }
    public void setLongitudeConducteur(Double v) { this.longitudeConducteur = v; }

    public double getPrix() { return prix; }
    public void setPrix(double v) { this.prix = v; }

    public LocalDateTime getDateConfirmation() { return dateConfirmation; }
    public void setDateConfirmation(LocalDateTime v) { this.dateConfirmation = v; }

    public String getDepartPassager() { return departPassager; }
    public void setDepartPassager(String v) { this.departPassager = v; }

    public String getArriveePassager() { return arriveePassager; }
    public void setArriveePassager(String v) { this.arriveePassager = v; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final ReservationResponse r = new ReservationResponse();
        public Builder id(Long val) { r.id = val; return this; }
        public Builder dateReservation(LocalDate val) { r.dateReservation = val; return this; }
        public Builder nbPlaces(int val) { r.nbPlaces = val; return this; }
        public Builder statut(Reservation.StatutReservation val) { r.statut = val; return this; }
        public Builder passagerId(Long val) { r.passagerId = val; return this; }
        public Builder passagerNom(String val) { r.passagerNom = val; return this; }
        public Builder passagerPrenom(String val) { r.passagerPrenom = val; return this; }
        public Builder conducteurId(Long val) { r.conducteurId = val; return this; }
        public Builder conducteurNom(String val) { r.conducteurNom = val; return this; }
        public Builder conducteurPrenom(String val) { r.conducteurPrenom = val; return this; }
        public Builder trajetId(Long val) { r.trajetId = val; return this; }
        public Builder villeDepart(String val) { r.villeDepart = val; return this; }
        public Builder villeArrivee(String val) { r.villeArrivee = val; return this; }
        public Builder prixPropose(Double val) { r.prixPropose = val; return this; }
        public Builder prixConducteur(Double val) { r.prixConducteur = val; return this; } // 
        public Builder nbTentatives(int val) { r.nbTentatives = val; return this; }
        public Builder passagerPhoto(String val) { r.passagerPhoto = val; return this; }
        public Builder djomyTransactionId(String val) { r.djomyTransactionId = val; return this; }
        public Builder statutPaiement(String val) { r.statutPaiement = val; return this; }
        public Builder urlPaiement(String val) { r.urlPaiement = val; return this; }
        public Builder passagerTelephone(String val) { r.passagerTelephone = val; return this; }
        public Builder trajetDemarre(boolean val) { r.trajetDemarre = val; return this; }
        public Builder latitudeConducteur(Double val) { r.latitudeConducteur = val; return this; }
        public Builder longitudeConducteur(Double val) { r.longitudeConducteur = val; return this; }
        public Builder dateConfirmation(LocalDateTime val) { r.dateConfirmation = val; return this; }
        public Builder prix(double val) { r.prix = val; return this; }
        public Builder departPassager(String val) { r.departPassager = val; return this; }
        public Builder arriveePassager(String val) { r.arriveePassager = val; return this; }
        public Builder dateHeureDepart(LocalDateTime val) { r.dateHeureDepart = val; return this; }
        public ReservationResponse build() { return r; }
    }
}