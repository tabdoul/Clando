// src/app/core/services/reservation.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Reservation } from '../../shared/models/reservation.model';
import { environment } from '../../../environments/environments';

@Injectable({
    providedIn: 'root'
})
export class ReservationService {

    private apiUrl = `${environment.apiUrl}/reservations`;

    constructor(private http: HttpClient) {}

    // POST /reservations
    creer(data: { nbPlaces: number; passagerId: number; trajetId: number; prixPropose?: number; numeroTelephone?: string }): Observable<Reservation> {
        return this.http.post<Reservation>(this.apiUrl, data);
    }

    // GET /reservations/{id}
    getById(id: number): Observable<Reservation> {
        return this.http.get<Reservation>(`${this.apiUrl}/${id}`);
    }

    // GET /reservations/passager/{passagerId}
    getByPassager(passagerId: number): Observable<Reservation[]> {
        return this.http.get<Reservation[]>(`${this.apiUrl}/passager/${passagerId}`);
    }

    // GET /reservations/trajet/{trajetId}
    getByTrajet(trajetId: number): Observable<Reservation[]> {
        return this.http.get<Reservation[]>(`${this.apiUrl}/trajet/${trajetId}`);
    }

    // GET /reservations/conducteur/{conducteurId}/en-attente
    // Utilisé par app.ts (badge) et notifications.ts
    getEnAttenteParConducteur(conducteurId: number): Observable<Reservation[]> {
        return this.http.get<Reservation[]>(`${this.apiUrl}/conducteur/${conducteurId}/en-attente`);
    }

    // PATCH /reservations/{id}/statut?statut=CONFIRMEE
    // Utilisé par le conducteur (confirmer/refuser) et le passager (annuler)
    changerStatut(id: number, statut: string): Observable<Reservation> {
        const params = new HttpParams().set('statut', statut);
        return this.http.patch<Reservation>(`${this.apiUrl}/${id}/statut`, null, { params });
    }

    // PATCH /reservations/{id}/annuler
    // Annulation avec logique de remboursement (Djomy)
    annuler(id: number): Observable<{
        typeRemboursement: string;
        montantPaye: number;
        montantRembourse: number;
        fraisAnnulation: number;
        message: string;
    }> {
        return this.http.patch<any>(`${this.apiUrl}/${id}/annuler`, null);
    }

    // PATCH /reservations/{id}/negociation?accepter=true
    repondreNegociation(id: number, accepter: boolean): Observable<Reservation> {
        const params = new HttpParams().set('accepter', String(accepter));
        return this.http.patch<Reservation>(`${this.apiUrl}/${id}/negociation`, null, { params });
    }

    // PATCH /reservations/{id}/nouvelle-proposition?nouveauPrix=50000
    nouvelleProposition(id: number, nouveauPrix: number): Observable<Reservation> {
        const params = new HttpParams().set('nouveauPrix', String(nouveauPrix));
        return this.http.patch<Reservation>(`${this.apiUrl}/${id}/nouvelle-proposition`, null, { params });
    }

    // DELETE /reservations/{id}
    supprimer(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}