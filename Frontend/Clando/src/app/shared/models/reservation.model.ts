export interface Reservation {
    id?: number;
    dateReservation?: string;
    nbPlaces: number;
    statut?: string;
    passagerId?: number;
    passagerNom?: string;
    passagerPrenom?: string;
    trajetId?: number;
    villeDepart?: string;
    villeArrivee?: string;
}
