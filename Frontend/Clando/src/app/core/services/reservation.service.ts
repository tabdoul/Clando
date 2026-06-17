import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';
import { Reservation } from '../../shared/models/reservation.model';

@Injectable({
    providedIn: 'root'
})
export class ReservationService {

    private apiUrl = `${environment.apiUrl}/reservations`;

    constructor(private http: HttpClient) {}

    getByPassager(passagerId: number): Observable<Reservation[]> {
        return this.http.get<Reservation[]>(`${this.apiUrl}/passager/${passagerId}`);
    }

    getByTrajet(trajetId: number): Observable<Reservation[]> {
        return this.http.get<Reservation[]>(`${this.apiUrl}/trajet/${trajetId}`);
    }

    creer(reservation: Reservation): Observable<Reservation> {
        return this.http.post<Reservation>(this.apiUrl, reservation);
    }

    changerStatut(id: number, statut: string): Observable<Reservation> {
        return this.http.patch<Reservation>(`${this.apiUrl}/${id}/statut`, null, {
            params: { statut }
        });
    }

    supprimer(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
    getEnAttenteParConducteur(conducteurId: number): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/conducteur/${conducteurId}/en-attente`);
}
}
