export type StatutReservation =
    | 'EN_ATTENTE'
    | 'CONFIRMEE'
    | 'ANNULEE'
    | 'REFUSEE'
    | 'PRIX_REFUSE'
    | 'CONTRE_OFFRE'
    | 'TERMINEE';

export interface Reservation {
    id?: number;
    dateReservation?: string;
    dateConfirmation?: string;
    nbPlaces: number;
    statut: StatutReservation;

    passagerId?: number;
    passagerNom?: string;
    passagerPrenom?: string;
    passagerPhoto?: string;
    passagerTelephone?: string;

    conducteurId?: number;
    conducteurNom?: string;
    conducteurPrenom?: string;

    trajetId?: number;
    villeDepart?: string;
    villeArrivee?: string;

    prix?: number;           // prix total avec commission (passager paie)
    prixPropose?: number;    // prix proposé par le passager
    prixConducteur?: number; // contre-offre du conducteur
    nbTentatives?: number;

    djomyTransactionId?: string;
    statutPaiement?: string;
    urlPaiement?: string;

    trajetDemarre?: boolean;
    latitudeConducteur?: number;
    longitudeConducteur?: number;

    departPassager?: string;
    arriveePassager?: string;
}

export interface ReservationRequest {
    nbPlaces: number;
    passagerId: number;
    trajetId: number;
    prixPropose?: number;
    numeroTelephone?: string;
    departPassager?: string;
    arriveePassager?: string;
}