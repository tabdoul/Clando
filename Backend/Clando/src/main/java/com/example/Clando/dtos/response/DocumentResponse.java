package com.example.Clando.dtos.response;

import com.example.Clando.entity.Document;
import java.time.LocalDateTime;

public class DocumentResponse {

    private Long id;
    private Document.TypeDocument type;
    private Document.StatutDocument statut;
    private LocalDateTime dateUpload;
    private String commentaireAdmin;
    private Long utilisateurId;

    public DocumentResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Document.TypeDocument getType() { return type; }
    public void setType(Document.TypeDocument type) { this.type = type; }

    public Document.StatutDocument getStatut() { return statut; }
    public void setStatut(Document.StatutDocument statut) { this.statut = statut; }

    public LocalDateTime getDateUpload() { return dateUpload; }
    public void setDateUpload(LocalDateTime dateUpload) { this.dateUpload = dateUpload; }

    public String getCommentaireAdmin() { return commentaireAdmin; }
    public void setCommentaireAdmin(String commentaireAdmin) { this.commentaireAdmin = commentaireAdmin; }

    public Long getUtilisateurId() { return utilisateurId; }
    public void setUtilisateurId(Long utilisateurId) { this.utilisateurId = utilisateurId; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final DocumentResponse r = new DocumentResponse();
        public Builder id(Long v) { r.id = v; return this; }
        public Builder type(Document.TypeDocument v) { r.type = v; return this; }
        public Builder statut(Document.StatutDocument v) { r.statut = v; return this; }
        public Builder dateUpload(LocalDateTime v) { r.dateUpload = v; return this; }
        public Builder commentaireAdmin(String v) { r.commentaireAdmin = v; return this; }
        public Builder utilisateurId(Long v) { r.utilisateurId = v; return this; }
        public DocumentResponse build() { return r; }
    }
}