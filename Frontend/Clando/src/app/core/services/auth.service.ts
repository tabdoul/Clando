import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environments';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private apiUrl = environment.apiUrl;
    private tokenKey = 'Clando_token';
    private userIdKey = 'Clando_user_id';
    private redirectUrlKey = 'Clando_redirect_url'; //  URL de retour
    private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());

    isLoggedIn$ = this.isLoggedInSubject.asObservable();

    constructor(private http: HttpClient) {}

    login(email: string, motDePasse: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/auth/login`, { email, motDePasse }).pipe(
            tap(response => {
                if (response && response.token) {
                    localStorage.setItem(this.tokenKey, response.token);
                }
                this.isLoggedInSubject.next(true);
                this.fetchUtilisateurByEmail(email);
            })
        );
    }

    fetchUtilisateurByEmail(email: string): void {
        this.http.get<any[]>(`${this.apiUrl}/utilisateurs`).subscribe({
            next: (utilisateurs) => {
                const user = utilisateurs.find(u => u.email === email);
                if (user) {
                    localStorage.setItem(this.userIdKey, user.id.toString());
                }
            }
        });
    }

    logout(): void {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userIdKey);
        localStorage.removeItem(this.redirectUrlKey);
        this.isLoggedInSubject.next(false);
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    hasToken(): boolean {
        return !!localStorage.getItem(this.tokenKey);
    }

    isLoggedIn(): boolean {
        return this.hasToken();
    }

    getUserEmail(): string | null {
        const token = this.getToken();
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.sub;
        } catch {
            return null;
        }
    }

    setUserId(id: number): void {
        localStorage.setItem(this.userIdKey, id.toString());
    }

    getUserId(): number | null {
        const id = localStorage.getItem(this.userIdKey);
        return id ? parseInt(id) : null;
    }

    //  Sauvegarder l'URL avant redirection vers login
    setRedirectUrl(url: string): void {
        localStorage.setItem(this.redirectUrlKey, url);
    }

    //  Récupérer et effacer l'URL de retour
    getAndClearRedirectUrl(): string | null {
        const url = localStorage.getItem(this.redirectUrlKey);
        localStorage.removeItem(this.redirectUrlKey);
        return url;
    }
}