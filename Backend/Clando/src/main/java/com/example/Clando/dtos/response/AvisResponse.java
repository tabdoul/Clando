package com.example.Clando.dtos.response;

import java.time.LocalDate;

public class AvisResponse {

    private Long id;
    private int note;
    private String commentaire;
    private LocalDate dateAvis;
    private Long auteurId;
    private String auteurNom;
    private String auteurPrenom;
    private Long destinataireId;
    private Long trajetId;

    public AvisResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public int getNote() { return note; }
    public void setNote(int note) { this.note = note; }

    public String getCommentaire() { return commentaire; }
    public void setCommentaire(String commentaire) { this.commentaire = commentaire; }

    public LocalDate getDateAvis() { return dateAvis; }
    public void setDateAvis(LocalDate dateAvis) { this.dateAvis = dateAvis; }

    public Long getAuteurId() { return auteurId; }
    public void setAuteurId(Long auteurId) { this.auteurId = auteurId; }

    public String getAuteurNom() { return auteurNom; }
    public void setAuteurNom(String auteurNom) { this.auteurNom = auteurNom; }

    public String getAuteurPrenom() { return auteurPrenom; }
    public void setAuteurPrenom(String auteurPrenom) { this.auteurPrenom = auteurPrenom; }

    public Long getDestinataireId() { return destinataireId; }
    public void setDestinataireId(Long destinataireId) { this.destinataireId = destinataireId; }

    public Long getTrajetId() { return trajetId; }
    public void setTrajetId(Long trajetId) { this.trajetId = trajetId; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final AvisResponse r = new AvisResponse();
        public Builder id(Long v) { r.id = v; return this; }
        public Builder note(int v) { r.note = v; return this; }
        public Builder commentaire(String v) { r.commentaire = v; return this; }
        public Builder dateAvis(LocalDate v) { r.dateAvis = v; return this; }
        public Builder auteurId(Long v) { r.auteurId = v; return this; }
        public Builder auteurNom(String v) { r.auteurNom = v; return this; }
        public Builder auteurPrenom(String v) { r.auteurPrenom = v; return this; }
        public Builder destinataireId(Long v) { r.destinataireId = v; return this; }
        public Builder trajetId(Long v) { r.trajetId = v; return this; }
        public AvisResponse build() { return r; }
    }
}