package com.example.Clando.dtos.request;

import jakarta.validation.constraints.*;

public class AvisRequest {

    @Min(1) @Max(5)
    private int note;

    @Size(max = 500)
    private String commentaire;

    @NotNull
    private Long auteurId;

    @NotNull
    private Long destinataireId;

    @NotNull
    private Long trajetId;

    public AvisRequest() {}

    public int getNote() { return note; }
    public void setNote(int note) { this.note = note; }

    public String getCommentaire() { return commentaire; }
    public void setCommentaire(String commentaire) { this.commentaire = commentaire; }

    public Long getAuteurId() { return auteurId; }
    public void setAuteurId(Long auteurId) { this.auteurId = auteurId; }

    public Long getDestinataireId() { return destinataireId; }
    public void setDestinataireId(Long destinataireId) { this.destinataireId = destinataireId; }

    public Long getTrajetId() { return trajetId; }
    public void setTrajetId(Long trajetId) { this.trajetId = trajetId; }
}