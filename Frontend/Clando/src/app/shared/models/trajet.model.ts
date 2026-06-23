export interface Trajet {
    id: number;
    villeDepart: string;
    villeArrivee: string;
    dateHeureDepart: string;
    prix: number;
    prixConducteur?: number;
    placesDisponibles: number;
    statut: string;
    itineraire?: string;
    conducteurId?: number;
    conducteurNom?: string;
    conducteurPrenom?: string;
    conducteurPhoto?: string;
    conducteurTelephone?: string;
    conducteurGenre?: string;
    vehiculeMarque?: string;
    vehiculeModele?: string;
    noteMoyenneConducteur?: number;
    nbTrajetsTerminesConducteur?: number;
    femmesUniquement?: boolean;
    latitudeConducteur?: number;
    longitudeConducteur?: number;
    trajetDemarre?: boolean;
}