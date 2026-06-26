package com.example.Clando.dtos.response;

import java.time.LocalDateTime;

public class MessageResponse {

    private Long id;
    private String contenu;
    private Long expediteurId;
    private String expediteurNom;
    private String expediteurPrenom;
    private String expediteurPhoto;
    private Long destinataireId;
    private String destinataireNom;
    private String destinatairePrenom;
    private String destinatairePhoto;
    private Long reservationId;
    private LocalDateTime dateEnvoi;
    private boolean lu;

    public MessageResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getContenu() { return contenu; }
    public void setContenu(String contenu) { this.contenu = contenu; }

    public Long getExpediteurId() { return expediteurId; }
    public void setExpediteurId(Long expediteurId) { this.expediteurId = expediteurId; }

    public String getExpediteurNom() { return expediteurNom; }
    public void setExpediteurNom(String expediteurNom) { this.expediteurNom = expediteurNom; }

    public String getExpediteurPrenom() { return expediteurPrenom; }
    public void setExpediteurPrenom(String expediteurPrenom) { this.expediteurPrenom = expediteurPrenom; }

    public String getExpediteurPhoto() { return expediteurPhoto; }
    public void setExpediteurPhoto(String expediteurPhoto) { this.expediteurPhoto = expediteurPhoto; }

    public Long getDestinataireId() { return destinataireId; }
    public void setDestinataireId(Long destinataireId) { this.destinataireId = destinataireId; }

    public String getDestinataireNom() { return destinataireNom; }
    public void setDestinataireNom(String destinataireNom) { this.destinataireNom = destinataireNom; }

    public String getDestinatairePrenom() { return destinatairePrenom; }
    public void setDestinatairePrenom(String destinatairePrenom) { this.destinatairePrenom = destinatairePrenom; }

    public String getDestinatairePhoto() { return destinatairePhoto; }
    public void setDestinatairePhoto(String destinatairePhoto) { this.destinatairePhoto = destinatairePhoto; }

    public Long getReservationId() { return reservationId; }
    public void setReservationId(Long reservationId) { this.reservationId = reservationId; }

    public LocalDateTime getDateEnvoi() { return dateEnvoi; }
    public void setDateEnvoi(LocalDateTime dateEnvoi) { this.dateEnvoi = dateEnvoi; }

    public boolean isLu() { return lu; }
    public void setLu(boolean lu) { this.lu = lu; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final MessageResponse r = new MessageResponse();
        public Builder id(Long v) { r.id = v; return this; }
        public Builder contenu(String v) { r.contenu = v; return this; }
        public Builder expediteurId(Long v) { r.expediteurId = v; return this; }
        public Builder expediteurNom(String v) { r.expediteurNom = v; return this; }
        public Builder expediteurPrenom(String v) { r.expediteurPrenom = v; return this; }
        public Builder expediteurPhoto(String v) { r.expediteurPhoto = v; return this; }
        public Builder destinataireId(Long v) { r.destinataireId = v; return this; }
        public Builder destinataireNom(String v) { r.destinataireNom = v; return this; }
        public Builder destinatairePrenom(String v) { r.destinatairePrenom = v; return this; }
        public Builder destinatairePhoto(String v) { r.destinatairePhoto = v; return this; }
        public Builder reservationId(Long v) { r.reservationId = v; return this; }
        public Builder dateEnvoi(LocalDateTime v) { r.dateEnvoi = v; return this; }
        public Builder lu(boolean v) { r.lu = v; return this; }
        public MessageResponse build() { return r; }
    }
}