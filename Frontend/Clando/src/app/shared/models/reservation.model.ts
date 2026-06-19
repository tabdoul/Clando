// src/app/shared/models/reservation.model.ts

export type StatutReservation =
    | 'EN_ATTENTE'
    | 'CONFIRMEE'
    | 'ANNULEE'
    | 'REFUSEE'
    | 'PRIX_REFUSE'
    | 'TERMINEE';

export interface Reservation {
    id?: number;
    dateReservation?: string;
    nbPlaces: number;
    statut: StatutReservation;

    // Passager (champs à plat — format renvoyé par ReservationResponse)
    passagerId?: number;
    passagerNom?: string;
    passagerPrenom?: string;
    passagerPhoto?: string;

    // Conducteur
    conducteurId?: number;
    conducteurNom?: string;
    conducteurPrenom?: string;

    // Trajet (champs à plat)
    trajetId?: number;
    villeDepart?: string;
    villeArrivee?: string;

    // Négociation
    prixPropose?: number;
    nbTentatives?: number;

    // Paiement Djomy
    djomyTransactionId?: string;
    statutPaiement?: string;
    urlPaiement?: string;
}