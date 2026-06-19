export interface Trajet {
    id: number;
    villeDepart: string;
    villeArrivee: string;
    dateHeureDepart: string;
    prix: number;
    placesDisponibles: number;
    statut: string;
    itineraire?: string;
    conducteurNom?: string;
    conducteurPrenom?: string;
    vehiculeMarque?: string;
    vehiculeModele?: string;
}