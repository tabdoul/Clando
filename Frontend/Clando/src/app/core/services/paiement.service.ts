import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';
import { Paiement } from '../../shared/models/paiement.model';

@Injectable({
    providedIn: 'root'
})
export class PaiementService {

    private apiUrl = `${environment.apiUrl}/paiements`;

    constructor(private http: HttpClient) {}

    getAll(): Observable<Paiement[]> {
        return this.http.get<Paiement[]>(this.apiUrl);
    }

    getByReservation(reservationId: number): Observable<Paiement> {
        return this.http.get<Paiement>(`${this.apiUrl}/reservation/${reservationId}`);
    }

    creer(paiement: Paiement): Observable<Paiement> {
        return this.http.post<Paiement>(this.apiUrl, paiement);
    }
}
