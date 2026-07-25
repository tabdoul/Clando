package com.example.wayvo.service;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import com.example.wayvo.dtos.request.PaiementRequest;
import com.example.wayvo.dtos.response.PaiementResponse;
import com.example.wayvo.entity.Paiement;
import com.example.wayvo.entity.Reservation;
import com.example.wayvo.repository.PaiementRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PaiementService {

    private final PaiementRepository paiementRepository;
    private final ReservationService reservationService;

    public PaiementService(PaiementRepository paiementRepository,
                           ReservationService reservationService) {
        this.paiementRepository = paiementRepository;
        this.reservationService = reservationService;
    }

    public PaiementResponse creer(PaiementRequest request) {
        Reservation reservation = reservationService.findById(request.getReservationId());

        if (paiementRepository.findByReservationId(request.getReservationId()).isPresent()) {
            throw new RuntimeException("Un paiement existe déjà pour cette réservation");
        }

        double montant = reservation.getTrajet().getPrix() * reservation.getNbPlaces();

        Paiement paiement = Paiement.builder()
                .montant(montant)
                .methode(request.getMethode())
                .statut(Paiement.StatutPaiement.EFFECTUE)
                .referenceTransaction(request.getReferenceTransaction())
                .reservation(reservation)
                .build();

        reservationService.changerStatut(
                reservation.getId(),
                Reservation.StatutReservation.CONFIRMEE
        );

        return toResponse(paiementRepository.save(paiement));
    }

    public PaiementResponse getById(Long id) {
        return toResponse(findById(id));
    }

    public PaiementResponse getByReservation(Long reservationId) {
        return toResponse(paiementRepository.findByReservationId(reservationId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Paiement non trouvé pour la réservation : " + reservationId)));
    }

    public List<PaiementResponse> getAll() {
        return paiementRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Paiement findById(Long id) {
        return paiementRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Paiement non trouvé avec l'id : " + id));
    }

    public PaiementResponse toResponse(Paiement p) {
        return PaiementResponse.builder()
                .id(p.getId())
                .montant(p.getMontant())
                .datePaiement(p.getDatePaiement())
                .methode(p.getMethode())
                .statut(p.getStatut())
                .referenceTransaction(p.getReferenceTransaction())
                .reservationId(p.getReservation().getId())
                .build();
    }
}