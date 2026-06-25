import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Reservation, ReservationRequest } from '../../shared/models/reservation.model';
import { environment } from '../../../environments/environments';

@Injectable({
    providedIn: 'root'
})
export class ReservationService {

    private apiUrl = `${environment.apiUrl}/reservations`;

    constructor(private http: HttpClient) {}

    creer(data: ReservationRequest): Observable<Reservation> {
        return this.http.post<Reservation>(this.apiUrl, data);
    }

    getById(id: number): Observable<Reservation> {
        return this.http.get<Reservation>(`${this.apiUrl}/${id}`);
    }

    getAll(): Observable<Reservation[]> {
        return this.http.get<Reservation[]>(this.apiUrl);
    }

    getByPassager(passagerId: number): Observable<Reservation[]> {
        return this.http.get<Reservation[]>(`${this.apiUrl}/passager/${passagerId}`);
    }

    getByTrajet(trajetId: number): Observable<Reservation[]> {
        return this.http.get<Reservation[]>(`${this.apiUrl}/trajet/${trajetId}`);
    }

    getEnAttenteParConducteur(conducteurId: number): Observable<Reservation[]> {
        return this.http.get<Reservation[]>(`${this.apiUrl}/conducteur/${conducteurId}/en-attente`);
    }

    changerStatut(id: number, statut: string): Observable<Reservation> {
        const params = new HttpParams().set('statut', statut);
        return this.http.patch<Reservation>(`${this.apiUrl}/${id}/statut`, null, { params });
    }

    annuler(id: number): Observable<{
        typeRemboursement: string;
        montantPaye: number;
        montantRembourse: number;
        fraisAnnulation: number;
        message: string;
    }> {
        return this.http.patch<any>(`${this.apiUrl}/${id}/annuler`, null);
    }

    // Accepter ou refuser sans contre-offre
    repondreNegociation(id: number, accepter: boolean): Observable<Reservation> {
        const params = new HttpParams().set('accepter', String(accepter));
        return this.http.patch<Reservation>(`${this.apiUrl}/${id}/negociation`, null, { params });
    }

    // Conducteur envoie une contre-offre avec son prix
    repondreNegociationAvecPrix(id: number, prixConducteur: number): Observable<Reservation> {
        const params = new HttpParams()
            .set('accepter', 'false')
            .set('prixConducteur', String(prixConducteur));
        return this.http.patch<Reservation>(`${this.apiUrl}/${id}/negociation`, null, { params });
    }

    nouvelleProposition(id: number, nouveauPrix: number): Observable<Reservation> {
        const params = new HttpParams().set('nouveauPrix', String(nouveauPrix));
        return this.http.patch<Reservation>(`${this.apiUrl}/${id}/nouvelle-proposition`, null, { params });
    }

    //Simulation de paiement

    payerTest(id: number): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.apiUrl}/${id}/payer-test`, null);
}

    // Paiement Orange Money
    payer(id: number, numeroTelephone: string): Observable<Reservation> {
        const params = new HttpParams().set('numeroTelephone', numeroTelephone);
        return this.http.post<Reservation>(`${this.apiUrl}/${id}/payer`, null, { params });
    }

    supprimer(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}