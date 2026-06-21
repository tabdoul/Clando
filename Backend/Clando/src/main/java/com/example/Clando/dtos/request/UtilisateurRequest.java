package com.example.Clando.dtos.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UtilisateurRequest {
    private String genre;

    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    private String prenom;

    @Email(message = "Email invalide")
    @NotBlank(message = "L'email est obligatoire")
    private String email;

   @Size(min = 6, message = "Le mot de passe doit contenir au moins 6 caractères")
private String motDePasse;

    private String telephone;


    public UtilisateurRequest() {}

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
    private String miniBio;

    public String getMiniBio() { return miniBio; }
    public void setMiniBio(String miniBio) { this.miniBio = miniBio; }
    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }
}