package com.example.Clando.entity;

import java.time.LocalDate;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "utilisateurs")
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String nom;

    @NotBlank
    @Column(nullable = false)
    private String prenom;

    @Email
    @NotBlank
    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String motDePasse;

    private String telephone;
    private String photo;
    @Column(length = 500)
    private String miniBio;

    @Column(nullable = false, updatable = false)
    private LocalDate dateInscription;

    @Column(nullable = false)
    private boolean verifie = false;

    private String expoPushToken;


    @OneToMany(mappedBy = "conducteur", cascade = CascadeType.ALL)
    private List<Vehicule> vehicules;

    @OneToMany(mappedBy = "conducteur", cascade = CascadeType.ALL)
    private List<Trajet> trajetsConduits;

    @OneToMany(mappedBy = "passager", cascade = CascadeType.ALL)
    private List<Reservation> reservations;

    @OneToMany(mappedBy = "auteur", cascade = CascadeType.ALL)
    private List<Avis> avisRediges;

    @OneToMany(mappedBy = "destinataire", cascade = CascadeType.ALL)
    private List<Avis> avisRecus;

    @PrePersist
    protected void onCreate() {
        this.dateInscription = LocalDate.now();
    }

    public Utilisateur() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMotDePasse() { return motDePasse; }
    public void setMotDePasse(String motDePasse) { this.motDePasse = motDePasse; }

    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }

    public String getPhoto() { return photo; }
    public void setPhoto(String photo) { this.photo = photo; }

    public String getMiniBio() { return miniBio; }
    public void setMiniBio(String miniBio) { this.miniBio = miniBio; }
    
    public String getExpoPushToken() { return expoPushToken; }
    public void setExpoPushToken(String expoPushToken) { this.expoPushToken = expoPushToken; }

    public LocalDate getDateInscription() { return dateInscription; }
    public void setDateInscription(LocalDate dateInscription) { this.dateInscription = dateInscription; }
    

    public boolean isVerifie() { return verifie; }
    public void setVerifie(boolean verifie) { this.verifie = verifie; }
    

    public List<Vehicule> getVehicules() { return vehicules; }
    public List<Trajet> getTrajetsConduits() { return trajetsConduits; }
    public List<Reservation> getReservations() { return reservations; }
    public List<Avis> getAvisRediges() { return avisRediges; }
    public List<Avis> getAvisRecus() { return avisRecus; }
    

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final Utilisateur u = new Utilisateur();
        public Builder nom(String v) { u.nom = v; return this; }
        public Builder prenom(String v) { u.prenom = v; return this; }
        public Builder email(String v) { u.email = v; return this; }
        public Builder motDePasse(String v) { u.motDePasse = v; return this; }
        public Builder telephone(String v) { u.telephone = v; return this; }
        public Builder miniBio(String v) { u.miniBio = v; return this; }
        public Builder verifie(boolean v) { u.verifie = v; return this; }
        public Builder photo(String v) { u.photo = v; return this; }
        public Utilisateur build() { return u; }
    }
} 