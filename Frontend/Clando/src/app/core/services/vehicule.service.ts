import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';
import { Vehicule } from '../../shared/models/vehicule.model';

@Injectable({
    providedIn: 'root'
})
export class VehiculeService {

    private apiUrl = `${environment.apiUrl}/vehicules`;

    constructor(private http: HttpClient) {}

    getAll(): Observable<Vehicule[]> {
        return this.http.get<Vehicule[]>(this.apiUrl);
    }

    getByConducteur(conducteurId: number): Observable<Vehicule[]> {
        return this.http.get<Vehicule[]>(`${this.apiUrl}/conducteur/${conducteurId}`);
    }

    creer(vehicule: Vehicule): Observable<Vehicule> {
        return this.http.post<Vehicule>(this.apiUrl, vehicule);
    }

    modifier(id: number, vehicule: Vehicule): Observable<Vehicule> {
        return this.http.put<Vehicule>(`${this.apiUrl}/${id}`, vehicule);
    }

    supprimer(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
