import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { ReservationService } from '../../../core/services/reservation.service';
import { Reservation } from '../../../shared/models/reservation.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
        MatChipsModule,
        MatBadgeModule
    ],
    templateUrl: './notifications.html',
    styleUrl: './notifications.css'
})
export class NotificationsComponent implements OnInit {

    reservations: Reservation[] = [];
    loading = false;

    constructor(
        private reservationService: ReservationService,
        private authService: AuthService,
        private snackBar: MatSnackBar,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.chargerReservations();
    }

    chargerReservations(): void {
        this.loading = true;
        const userId = this.authService.getUserId();
        if (!userId) return;

        this.reservationService.getEnAttenteParConducteur(userId).subscribe({
            next: (data) => {
                this.reservations = data;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loading = false;
                this.cdr.detectChanges();
                this.snackBar.open('Erreur lors du chargement', 'Fermer', { duration: 3000 });
            }
        });
    }

    accepter(id: number): void {
        this.reservationService.changerStatut(id, 'CONFIRMEE').subscribe({
            next: () => {
                this.snackBar.open('✅ Réservation confirmée !', 'Fermer', { duration: 3000 });
                this.chargerReservations();
                this.cdr.detectChanges();
            },
            error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
        });
    }

    refuser(id: number): void {
        this.reservationService.changerStatut(id, 'REFUSEE').subscribe({
            next: () => {
                this.snackBar.open('❌ Réservation refusée', 'Fermer', { duration: 3000 });
                this.chargerReservations();
                this.cdr.detectChanges();
            },
            error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
        });
    }

    getStatutColor(statut: string): string {
        switch (statut) {
            case 'CONFIRMEE': return 'primary';
            case 'EN_ATTENTE': return 'accent';
            case 'REFUSEE': return 'warn';
            default: return 'primary';
        }
    }
}
