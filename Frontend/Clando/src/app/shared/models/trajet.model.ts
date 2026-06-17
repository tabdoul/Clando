export interface Trajet {
    id?: number;
    villeDepart: string;
    villeArrivee: string;
    dateHeureDepart: string;
    placesDisponibles: number;
    prix: number;
    itineraire?: string;
    statut?: string;
    conducteurId?: number;
    conducteurNom?: string;
    conducteurPrenom?: string;
    vehiculeId?: number;
    vehiculeMarque?: string;
    vehiculeModele?: string;
}
