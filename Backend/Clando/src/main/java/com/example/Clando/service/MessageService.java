package com.example.Clando.service;

import com.example.Clando.dtos.request.MessageRequest;
import com.example.Clando.dtos.response.MessageResponse;
import com.example.Clando.entity.Message;
import com.example.Clando.entity.Reservation;
import com.example.Clando.entity.Utilisateur;
import com.example.Clando.repository.MessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        Reservation reservation = reservationService.findById(request.getReservationId());

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
                .reservationId(m.getReservation().getId())
                .dateEnvoi(m.getDateEnvoi())
                .lu(m.isLu())
                .build();
    }
}