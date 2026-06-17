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

    public MessageService(MessageRepository messageRepository,
                          UtilisateurService utilisateurService,
                          ReservationService reservationService) {
        this.messageRepository = messageRepository;
        this.utilisateurService = utilisateurService;
        this.reservationService = reservationService;
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

        return toResponse(messageRepository.save(message));
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
                .destinataireId(m.getDestinataire().getId())
                .reservationId(m.getReservation().getId())
                .dateEnvoi(m.getDateEnvoi())
                .lu(m.isLu())
                .destinataireNom(m.getDestinataire().getNom())
                .destinatairePrenom(m.getDestinataire().getPrenom())
                .build();
    }
}