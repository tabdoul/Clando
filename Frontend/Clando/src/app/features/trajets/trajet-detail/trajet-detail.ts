import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { TrajetService } from '../../../core/services/trajet.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { AuthService } from '../../../core/services/auth.service';
import { Trajet } from '../../../shared/models/trajet.model';

@Component({
    selector: 'app-trajet-detail',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatSnackBarModule,
        MatDividerModule
    ],
    templateUrl: './trajet-detail.html',
    styleUrl: './trajet-detail.css'
})
export class TrajetDetailComponent implements OnInit {
    trajet: Trajet | null = null;
    loading = true;
    loadingReservation = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private trajetService: TrajetService,
        private reservationService: ReservationService,
        private authService: AuthService,
        private snackBar: MatSnackBar,
        private cdr: ChangeDetectorRef,
        
    ) {}

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        this.trajetService.getById(id).subscribe({
            next: (data) => {
                this.trajet = data;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loading = false;
                this.cdr.detectChanges();
                this.router.navigate(['/trajets']);
            }
        });
    }

    reserver(): void {
        if (!this.authService.isLoggedIn()) {
            this.authService.setRedirectUrl(this.router.url);
            this.router.navigate(['/login']);
            return;
        }

        const userId = this.authService.getUserId();
        if (!userId || !this.trajet) return;

        this.loadingReservation = true;
        this.reservationService.creer({
            nbPlaces: 1,
            passagerId: userId,
            trajetId: this.trajet.id,
            departPassager: this.trajet.villeDepart,
            arriveePassager: this.trajet.villeArrivee
        }).subscribe({
            next: () => {
                this.loadingReservation = false;
                this.snackBar.open('Demande envoyee ! Le conducteur va confirmer votre reservation.', 'Fermer', { duration: 4000 });
                this.router.navigate(['/mes-reservations']);
            },
            error: (err: any) => {
    this.loadingReservation = false;
    this.snackBar.open(err.error?.erreur || 'Erreur lors de la reservation', 'Fermer', { duration: 3000 });
}
        });
    }

    get isConnecte(): boolean {
        return this.authService.isLoggedIn();
    }

    get placesRestantes(): string {
        if (!this.trajet) return '';
        const n = this.trajet.placesDisponibles;
        if (n === 0) return 'Complet';
        if (n === 1) return '1 place restante';
        return `${n} places disponibles`;
    }
}