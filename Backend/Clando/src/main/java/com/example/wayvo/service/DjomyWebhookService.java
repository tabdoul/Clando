package com.example.wayvo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.wayvo.entity.Reservation;
import com.example.wayvo.repository.ReservationRepository;

import java.util.Optional;

@Service
public class DjomyWebhookService {

    private static final Logger log = LoggerFactory.getLogger(DjomyWebhookService.class);

    private final DjomyService djomyService;
    private final ReservationRepository reservationRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DjomyWebhookService(DjomyService djomyService,
                                ReservationRepository reservationRepository,
                                NotificationService notificationService) {
        this.djomyService = djomyService;
        this.reservationRepository = reservationRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public boolean traiterWebhook(String payload, String signature) throws Exception {
        boolean signatureValide = djomyService.verifierSignatureWebhook(payload, signature);
        if (!signatureValide) {
            log.warn("Webhook Djomy recu avec signature invalide, ignore");
            return false;
        }

        JsonNode racine = objectMapper.readTree(payload);
        String eventType = racine.path("eventType").asText();
        JsonNode data = extraireData(racine, eventType);

        log.info("Webhook Djomy recu : {}", eventType);

        switch (eventType) {
            case "payment.success" -> traiterPaiementSuccess(data);
            case "payment.failed" -> traiterPaiementFailed(data);
            case "payout.success" -> traiterPayoutSuccess(data);
            case "payout.failed" -> traiterPayoutFailed(data);
            default -> log.info("Evenement webhook ignore (non gere) : {}", eventType);
        }

        return true;
    }

    //  Gere V1 (data directement) et V2 (data.payment / data.payout)
    private JsonNode extraireData(JsonNode racine, String eventType) {
        JsonNode data = racine.path("data");
        if (eventType.startsWith("payment.") && data.has("payment")) {
            return data.path("payment");
        }
        if (eventType.startsWith("payout.") && data.has("payout")) {
            return data.path("payout");
        }
        return data;
    }

    private void traiterPaiementSuccess(JsonNode data) {
        String transactionId = data.path("transactionId").asText(null);
        if (transactionId == null) {
            log.warn("Webhook payment.success sans transactionId, ignore");
            return;
        }

        Optional<Reservation> resOpt = reservationRepository.findByDjomyTransactionId(transactionId)
            .stream().findFirst();
        if (resOpt.isEmpty()) {
            log.warn("Aucune reservation trouvee pour transactionId {}", transactionId);
            return;
        }

        Reservation reservation = resOpt.get();
        reservation.setStatutPaiement("SUCCESS");
        reservationRepository.save(reservation);

        String token = reservation.getPassager().getExpoPushToken();
        if (token != null && !token.isBlank()) {
            notificationService.envoyerNotification(
                token,
                "Paiement confirme !",
                "Votre paiement pour le trajet " +
                reservation.getTrajet().getVilleDepart() + " -> " + reservation.getTrajet().getVilleArrivee() +
                " a bien ete reçu."
            );
        }
        log.info("Paiement confirme via webhook pour reservation {}", reservation.getId());
    }

    private void traiterPaiementFailed(JsonNode data) {
        String transactionId = data.path("transactionId").asText(null);
        if (transactionId == null) return;

        Optional<Reservation> resOpt = reservationRepository.findByDjomyTransactionId(transactionId)
            .stream().findFirst();
        if (resOpt.isEmpty()) return;

        Reservation reservation = resOpt.get();
        reservation.setStatutPaiement("FAILED");
        reservationRepository.save(reservation);

        String token = reservation.getPassager().getExpoPushToken();
        if (token != null && !token.isBlank()) {
            notificationService.envoyerNotification(
                token,
                "Paiement echoue",
                "Votre paiement pour le trajet " +
                reservation.getTrajet().getVilleDepart() + " -> " + reservation.getTrajet().getVilleArrivee() +
                " a echoue. Veuillez reessayer."
            );
        }
        log.info("Paiement echoue via webhook pour reservation {}", reservation.getId());
    }

    //  La reference du payout encode l'id de la reservation : PAYOUT-{id}-{timestamp}
    private Long extraireReservationIdDeReference(String reference) {
        if (reference == null || !reference.startsWith("PAYOUT-")) return null;
        try {
            String[] parts = reference.split("-");
            return Long.parseLong(parts[1]);
        } catch (Exception e) {
            return null;
        }
    }

    private void traiterPayoutSuccess(JsonNode data) {
        String reference = data.path("reference").asText(
            data.path("merchantPaymentReference").asText(null)
        );
        Long reservationId = extraireReservationIdDeReference(reference);
        if (reservationId == null) {
            log.warn("Webhook payout.success sans reference exploitable : {}", reference);
            return;
        }

        Reservation reservation = reservationRepository.findById(reservationId).orElse(null);
        if (reservation == null) return;

        reservation.setStatutPayout("SUCCESS");
        reservationRepository.save(reservation);

        String token = reservation.getTrajet().getConducteur().getExpoPushToken();
        if (token != null && !token.isBlank()) {
            notificationService.envoyerNotification(
                token,
                "Paiement recu !",
                "Votre paiement pour le trajet " +
                reservation.getTrajet().getVilleDepart() + " -> " + reservation.getTrajet().getVilleArrivee() +
                " a bien ete verse sur votre compte Orange Money."
            );
        }
        log.info("Payout confirme via webhook pour reservation {}", reservation.getId());
    }

    private void traiterPayoutFailed(JsonNode data) {
        String reference = data.path("reference").asText(
            data.path("merchantPaymentReference").asText(null)
        );
        Long reservationId = extraireReservationIdDeReference(reference);
        if (reservationId == null) return;

        Reservation reservation = reservationRepository.findById(reservationId).orElse(null);
        if (reservation == null) return;

        reservation.setStatutPayout("FAILED");
        //  On remet payoutEffectue a false pour permettre un nouveau declenchement
        // par le scheduler ou une action admin manuelle
        reservation.setPayoutEffectue(false);
        reservationRepository.save(reservation);

        String token = reservation.getTrajet().getConducteur().getExpoPushToken();
        if (token != null && !token.isBlank()) {
            notificationService.envoyerNotification(
                token,
                "Probleme de paiement",
                "Le versement pour le trajet " +
                reservation.getTrajet().getVilleDepart() + " -> " + reservation.getTrajet().getVilleArrivee() +
                " a echoue. L'equipe WayVo va reessayer."
            );
        }
        log.warn("Payout echoue via webhook pour reservation {}", reservation.getId());
    }
}