package com.example.wayvo.dtos.response;

import java.time.LocalDateTime;

import com.example.wayvo.entity.Signalement;

public class SignalementResponse {

    private Long id;
    private Signalement.TypeSignalement type;
    private String description;
    private Signalement.StatutSignalement statut;
    private LocalDateTime dateSignalement;
    private String reponseAdmin;
    private Long utilisateurId;
    private String utilisateurNom;
    private String utilisateurPrenom;

    public SignalementResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Signalement.TypeSignalement getType() { return type; }
    public void setType(Signalement.TypeSignalement type) { this.type = type; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Signalement.StatutSignalement getStatut() { return statut; }
    public void setStatut(Signalement.StatutSignalement statut) { this.statut = statut; }

    public LocalDateTime getDateSignalement() { return dateSignalement; }
    public void setDateSignalement(LocalDateTime dateSignalement) { this.dateSignalement = dateSignalement; }

    public String getReponseAdmin() { return reponseAdmin; }
    public void setReponseAdmin(String reponseAdmin) { this.reponseAdmin = reponseAdmin; }

    public Long getUtilisateurId() { return utilisateurId; }
    public void setUtilisateurId(Long utilisateurId) { this.utilisateurId = utilisateurId; }

    public String getUtilisateurNom() { return utilisateurNom; }
    public void setUtilisateurNom(String utilisateurNom) { this.utilisateurNom = utilisateurNom; }

    public String getUtilisateurPrenom() { return utilisateurPrenom; }
    public void setUtilisateurPrenom(String utilisateurPrenom) { this.utilisateurPrenom = utilisateurPrenom; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final SignalementResponse r = new SignalementResponse();
        public Builder id(Long v) { r.id = v; return this; }
        public Builder type(Signalement.TypeSignalement v) { r.type = v; return this; }
        public Builder description(String v) { r.description = v; return this; }
        public Builder statut(Signalement.StatutSignalement v) { r.statut = v; return this; }
        public Builder dateSignalement(LocalDateTime v) { r.dateSignalement = v; return this; }
        public Builder reponseAdmin(String v) { r.reponseAdmin = v; return this; }
        public Builder utilisateurId(Long v) { r.utilisateurId = v; return this; }
        public Builder utilisateurNom(String v) { r.utilisateurNom = v; return this; }
        public Builder utilisateurPrenom(String v) { r.utilisateurPrenom = v; return this; }
        public SignalementResponse build() { return r; }
    }
}