export interface Vehicule {
    id?: number;
    marque: string;
    modele: string;
    immatriculation: string;
    nbPlaces: number;
    conducteurId?: number;
    conducteurNom?: string;
    conducteurPrenom?: string;
}
