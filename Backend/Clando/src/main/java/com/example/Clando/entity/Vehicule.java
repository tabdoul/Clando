package com.example.Clando.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.util.List;

@Entity
@Table(name = "vehicules")
public class Vehicule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String marque;

    @NotBlank
    @Column(nullable = false)
    private String modele;

    @NotBlank
    @Column(nullable = false, unique = true)
    private String immatriculation;

    @Min(1) @Max(9)
    @Column(nullable = false)
    private int nbPlaces;

    @ManyToOne
    @JoinColumn(name = "conducteur_id", nullable = false)
    private Utilisateur conducteur;

    @OneToMany(mappedBy = "vehicule", cascade = CascadeType.ALL)
    private List<Trajet> trajets;

    public Vehicule() {}

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

    public Utilisateur getConducteur() { return conducteur; }
    public void setConducteur(Utilisateur conducteur) { this.conducteur = conducteur; }

    public List<Trajet> getTrajets() { return trajets; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final Vehicule v = new Vehicule();
        public Builder marque(String val) { v.marque = val; return this; }
        public Builder modele(String val) { v.modele = val; return this; }
        public Builder immatriculation(String val) { v.immatriculation = val; return this; }
        public Builder nbPlaces(int val) { v.nbPlaces = val; return this; }
        public Builder conducteur(Utilisateur val) { v.conducteur = val; return this; }
        public Vehicule build() { return v; }
    }
}