package com.example.wayvo.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.wayvo.dtos.request.MessageRequest;
import com.example.wayvo.dtos.response.MessageResponse;
import com.example.wayvo.entity.Message;
import com.example.wayvo.entity.Reservation;
import com.example.wayvo.entity.Utilisateur;
import com.example.wayvo.repository.MessageRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final UtilisateurService utilisateurService;
    private final ReservationService reservationService;
    private final NotificationService notificationService; // ✅ ajouté

    public MessageService(MessageRepository messageRepository,
                          UtilisateurService utilisateurService,
                          ReservationService reservationService,
                          NotificationService notificationService) { 
        this.messageRepository = messageRepository;
        this.utilisateurService = utilisateurService;
        this.reservationService = reservationService;
        this.notificationService = notificationService; 
    }

    public MessageResponse envoyer(MessageRequest request) {
        Utilisateur expediteur = utilisateurService.findById(request.getExpediteurId());
        Utilisateur destinataire = utilisateurService.findById(request.getDestinataireId());

        // La reservation est optionnelle : un passager peut contacter un conducteur
        // avant meme d'avoir reserve un trajet (question, negociation...)
        Reservation reservation = request.getReservationId() != null
            ? reservationService.findById(request.getReservationId())
            : null;

        Message message = Message.builder()
                .contenu(request.getContenu())
                .expediteur(expediteur)
                .destinataire(destinataire)
                .reservation(reservation)
                .build();

        Message saved = messageRepository.save(message);

        //  Notification push au destinataire à chaque message
        String token = destinataire.getExpoPushToken();
        if (token != null && !token.isBlank()) {
            String contenuTronque = request.getContenu().length() > 80
                ? request.getContenu().substring(0, 80) + "..."
                : request.getContenu();

            notificationService.envoyerNotification(
                token,
                expediteur.getPrenom() + " " + expediteur.getNom(),
                contenuTronque
            );
        }

        return toResponse(saved);
    }

    public List<MessageResponse> getByReservation(Long reservationId) {
        return messageRepository.findByReservationIdOrderByDateEnvoiAsc(reservationId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<MessageResponse> getConversations(Long userId) {
        return messageRepository
                .findByDestinataireIdOrExpediteurIdOrderByDateEnvoiDesc(userId, userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    //  Historique d'une conversation entre deux utilisateurs SANS reservation
    public List<MessageResponse> getConversationSansReservation(Long userId1, Long userId2) {
        return messageRepository.findConversationSansReservation(userId1, userId2)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Long getNbMessagesNonLus(Long userId) {
        return messageRepository.countMessagesNonLus(userId);
    }

    @Transactional
    public void marquerCommeLus(Long reservationId, Long userId) {
        List<Message> messages = messageRepository
                .findByReservationIdAndDestinataireIdAndLuFalse(reservationId, userId);
        messages.forEach(m -> {
            m.setLu(true);
            messageRepository.save(m);
        });
    }

    //  Marque comme lus les messages d'une conversation SANS reservation
    @Transactional
    public void marquerConversationSansReservationCommeLue(Long autreUtilisateurId, Long lecteurId) {
        List<Message> messages = messageRepository
                .findByReservationIsNullAndDestinataireIdAndExpediteurIdAndLuFalse(lecteurId, autreUtilisateurId);
        messages.forEach(m -> {
            m.setLu(true);
            messageRepository.save(m);
        });
    }

    public MessageResponse toResponse(Message m) {
        return MessageResponse.builder()
                .id(m.getId())
                .contenu(m.getContenu())
                .expediteurId(m.getExpediteur().getId())
                .expediteurNom(m.getExpediteur().getNom())
                .expediteurPrenom(m.getExpediteur().getPrenom())
                .expediteurPhoto(m.getExpediteur().getPhoto())
                .destinataireId(m.getDestinataire().getId())
                .destinataireNom(m.getDestinataire().getNom())
                .destinatairePrenom(m.getDestinataire().getPrenom())
                .destinatairePhoto(m.getDestinataire().getPhoto())
                .reservationId(m.getReservation() != null ? m.getReservation().getId() : null)
                .dateEnvoi(m.getDateEnvoi())
                .lu(m.isLu())
                .build();
    }
}