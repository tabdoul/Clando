package com.example.Clando.dtos.response;

import java.time.LocalDate;

public class UtilisateurResponse {

    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String telephone;
    private LocalDate dateInscription;
    private String miniBio;
    private String photo;
    private boolean verifie;

    public UtilisateurResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }

    public LocalDate getDateInscription() { return dateInscription; }
    public void setDateInscription(LocalDate dateInscription) { this.dateInscription = dateInscription; }

    public String getMiniBio() { return miniBio; }
    public void setMiniBio(String miniBio) { this.miniBio = miniBio; }

    public String getPhoto() { return photo; }
    public void setPhoto(String photo) { this.photo = photo; }

    public boolean isVerifie() { return verifie; }
    public void setVerifie(boolean verifie) { this.verifie = verifie; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final UtilisateurResponse r = new UtilisateurResponse();
        public Builder id(Long val) { r.id = val; return this; }
        public Builder nom(String val) { r.nom = val; return this; }
        public Builder prenom(String val) { r.prenom = val; return this; }
        public Builder email(String val) { r.email = val; return this; }
        public Builder telephone(String val) { r.telephone = val; return this; }
        public Builder dateInscription(LocalDate val) { r.dateInscription = val; return this; }
        public Builder miniBio(String v) { r.miniBio = v; return this; }
        public Builder photo(String v) { r.photo = v; return this; }
        public Builder verifie(boolean v) { r.verifie = v; return this; }
        public UtilisateurResponse build() { return r; }
    }
}