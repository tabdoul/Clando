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

    passagerId?: number;
    passagerNom?: string;
    passagerPrenom?: string;
    passagerPhoto?: string;

    conducteurId?: number;
    conducteurNom?: string;
    conducteurPrenom?: string;

    trajetId?: number;
    villeDepart?: string;
    villeArrivee?: string;

    prixPropose?: number;
    nbTentatives?: number;

    djomyTransactionId?: string;
    statutPaiement?: string;
    urlPaiement?: string;

    // ✅ Trajet passager
    departPassager?: string;
    arriveePassager?: string;
}

// ✅ Interface dédiée pour la création
export interface ReservationRequest {
    nbPlaces: number;
    passagerId: number;
    trajetId: number;
    prixPropose?: number;
    numeroTelephone?: string;
    departPassager?: string;
    arriveePassager?: string;
}