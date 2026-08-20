package com.example.wayvo.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.wayvo.dtos.request.MessageRequest;
import com.example.wayvo.dtos.response.MessageResponse;
import com.example.wayvo.service.MessageService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping
    public ResponseEntity<MessageResponse> envoyer(@Valid @RequestBody MessageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(messageService.envoyer(request));
    }

    @GetMapping("/reservation/{reservationId}")
    public ResponseEntity<List<MessageResponse>> getByReservation(@PathVariable Long reservationId) {
        return ResponseEntity.ok(messageService.getByReservation(reservationId));
    }

    @GetMapping("/conversations/{userId}")
    public ResponseEntity<List<MessageResponse>> getConversations(@PathVariable Long userId) {
        return ResponseEntity.ok(messageService.getConversations(userId));
    }

    //  Historique d'une conversation entre deux utilisateurs SANS reservation
    // (contact d'un conducteur avant toute reservation)
    @GetMapping("/conversation")
    public ResponseEntity<List<MessageResponse>> getConversationSansReservation(
            @RequestParam Long userId1, @RequestParam Long userId2) {
        return ResponseEntity.ok(messageService.getConversationSansReservation(userId1, userId2));
    }

    @GetMapping("/non-lus/{userId}")
    public ResponseEntity<Map<String, Long>> getNbNonLus(@PathVariable Long userId) {
        return ResponseEntity.ok(Map.of("nbNonLus", messageService.getNbMessagesNonLus(userId)));
    }

    @PatchMapping("/marquer-lus/{reservationId}/{userId}")
    public ResponseEntity<Void> marquerLus(@PathVariable Long reservationId,
                                            @PathVariable Long userId) {
        messageService.marquerCommeLus(reservationId, userId);
        return ResponseEntity.ok().build();
    }

    //  Marque comme lus les messages d'une conversation SANS reservation
    @PatchMapping("/marquer-lus-conversation/{autreUtilisateurId}/{lecteurId}")
    public ResponseEntity<Void> marquerConversationSansReservationLue(
            @PathVariable Long autreUtilisateurId,
            @PathVariable Long lecteurId) {
        messageService.marquerConversationSansReservationCommeLue(autreUtilisateurId, lecteurId);
        return ResponseEntity.ok().build();
    }
}