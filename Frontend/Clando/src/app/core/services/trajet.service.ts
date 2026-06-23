import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';
import { Trajet } from '../../shared/models/trajet.model';


@Injectable({
    providedIn: 'root'
})
export class TrajetService {

    private apiUrl = `${environment.apiUrl}/trajets`;

    constructor(private http: HttpClient) {}

    getAll(): Observable<Trajet[]> {
        return this.http.get<Trajet[]>(this.apiUrl);
    }

    getById(id: number): Observable<Trajet> {
        return this.http.get<Trajet>(`${this.apiUrl}/${id}`);
    }
rechercher(villeDepart: string, villeArrivee: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/rechercher`, {
        params: { villeDepart, villeArrivee }
    });
}

    getByConducteur(conducteurId: number): Observable<Trajet[]> {
        return this.http.get<Trajet[]>(`${this.apiUrl}/conducteur/${conducteurId}`);
    }

    creer(trajet: any): Observable<Trajet> {
        return this.http.post<Trajet>(this.apiUrl, trajet);
    }

    modifier(id: number, trajet: Trajet): Observable<Trajet> {
        return this.http.put<Trajet>(`${this.apiUrl}/${id}`, trajet);
    }

    changerStatut(id: number, statut: string): Observable<Trajet> {
        return this.http.patch<Trajet>(`${this.apiUrl}/${id}/statut`, null, {
            params: { statut }
        });
    }

    supprimer(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
