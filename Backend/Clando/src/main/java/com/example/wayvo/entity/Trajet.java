package com.example.wayvo.entity;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "trajets")
public class Trajet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String villeDepart;

    @NotBlank
    @Column(nullable = false)
    private String villeArrivee;

    @Column(nullable = false)
    private LocalDateTime dateHeureDepart;

    @Min(0)
    @Column(nullable = false)
    private int placesDisponibles;

    @DecimalMin("0.0")
    @Column(nullable = false)
    private double prix;

    @Column
    private String itineraire;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutTrajet statut = StatutTrajet.OUVERT;

    @ManyToOne
    @JoinColumn(name = "conducteur_id", nullable = false)
    private Utilisateur conducteur;

    @ManyToOne
    @JoinColumn(name = "vehicule_id", nullable = false)
    private Vehicule vehicule;

    @OneToMany(mappedBy = "trajet", cascade = CascadeType.ALL)
    private List<Reservation> reservations;

    @OneToMany(mappedBy = "trajet", cascade = CascadeType.ALL)
    private List<Avis> avis;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    @Column(nullable = false)
    private boolean femmesUniquement = false;

    // GPS
    @Column
    private Double latitudeConducteur;

    @Column
    private Double longitudeConducteur;

    @Column(nullable = false)
    private boolean trajetDemarre = false;

    @PrePersist
    protected void onCreate() {
        this.dateCreation = LocalDateTime.now();
    }

    public enum StatutTrajet {
        OUVERT, COMPLET, ANNULE, TERMINE
    }

    public Trajet() {}

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

    public StatutTrajet getStatut() { return statut; }
    public void setStatut(StatutTrajet statut) { this.statut = statut; }

    public Utilisateur getConducteur() { return conducteur; }
    public void setConducteur(Utilisateur conducteur) { this.conducteur = conducteur; }

    public Vehicule getVehicule() { return vehicule; }
    public void setVehicule(Vehicule vehicule) { this.vehicule = vehicule; }

    public List<Reservation> getReservations() { return reservations; }
    public List<Avis> getAvis() { return avis; }
    public LocalDateTime getDateCreation() { return dateCreation; }

    public boolean isFemmesUniquement() { return femmesUniquement; }
    public void setFemmesUniquement(boolean femmesUniquement) { this.femmesUniquement = femmesUniquement; }

    public Double getLatitudeConducteur() { return latitudeConducteur; }
    public void setLatitudeConducteur(Double v) { this.latitudeConducteur = v; }

    public Double getLongitudeConducteur() { return longitudeConducteur; }
    public void setLongitudeConducteur(Double v) { this.longitudeConducteur = v; }

    public boolean isTrajetDemarre() { return trajetDemarre; }
    public void setTrajetDemarre(boolean v) { this.trajetDemarre = v; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final Trajet t = new Trajet();
        public Builder villeDepart(String val) { t.villeDepart = val; return this; }
        public Builder villeArrivee(String val) { t.villeArrivee = val; return this; }
        public Builder dateHeureDepart(LocalDateTime val) { t.dateHeureDepart = val; return this; }
        public Builder placesDisponibles(int val) { t.placesDisponibles = val; return this; }
        public Builder prix(double val) { t.prix = val; return this; }
        public Builder itineraire(String val) { t.itineraire = val; return this; }
        public Builder statut(StatutTrajet val) { t.statut = val; return this; }
        public Builder conducteur(Utilisateur val) { t.conducteur = val; return this; }
        public Builder vehicule(Vehicule val) { t.vehicule = val; return this; }
        public Builder femmesUniquement(boolean val) { t.femmesUniquement = val; return this; }
        public Trajet build() { return t; }
    }
}