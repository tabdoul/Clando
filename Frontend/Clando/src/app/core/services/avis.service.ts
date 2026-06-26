import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';
import { Avis } from '../../shared/models/avis.model';

@Injectable({
    providedIn: 'root'
})
export class AvisService {

    private apiUrl = `${environment.apiUrl}/avis`;

    constructor(private http: HttpClient) {}

    getByDestinataire(destinataireId: number): Observable<Avis[]> {
        return this.http.get<Avis[]>(`${this.apiUrl}/destinataire/${destinataireId}`);
    }

    getByAuteur(auteurId: number): Observable<Avis[]> {
        return this.http.get<Avis[]>(`${this.apiUrl}/auteur/${auteurId}`);
    }

    getMoyenne(destinataireId: number): Observable<number> {
        return this.http.get<number>(`${this.apiUrl}/moyenne/${destinataireId}`);
    }

    creer(avis: Avis): Observable<Avis> {
        return this.http.post<Avis>(this.apiUrl, avis);
    }

    supprimer(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
