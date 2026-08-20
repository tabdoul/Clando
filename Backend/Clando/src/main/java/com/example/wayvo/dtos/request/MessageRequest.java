package com.example.wayvo.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class MessageRequest {

    @NotBlank(message = "Le contenu est obligatoire")
    private String contenu;

    @NotNull
    private Long expediteurId;

    @NotNull
    private Long destinataireId;

    private Long reservationId;

    public MessageRequest() {}

    public String getContenu() { return contenu; }
    public void setContenu(String contenu) { this.contenu = contenu; }

    public Long getExpediteurId() { return expediteurId; }
    public void setExpediteurId(Long expediteurId) { this.expediteurId = expediteurId; }

    public Long getDestinataireId() { return destinataireId; }
    public void setDestinataireId(Long destinataireId) { this.destinataireId = destinataireId; }

    public Long getReservationId() { return reservationId; }
    public void setReservationId(Long reservationId) { this.reservationId = reservationId; }
}