export interface Paiement {
    id?: number;
    montant?: number;
    datePaiement?: string;
    methode: string;
    statut?: string;
    referenceTransaction?: string;
    reservationId: number;
}
