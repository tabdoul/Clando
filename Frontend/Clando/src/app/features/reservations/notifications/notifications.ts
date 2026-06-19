// src/app/features/reservations/notifications/notifications.ts

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
        if (!userId) {
            this.loading = false;
            return;
        }

        // GET /reservations/conducteur/{id}/en-attente
        this.reservationService.getEnAttenteParConducteur(userId).subscribe({
            next: (data: Reservation[]) => {
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
        // PATCH /reservations/{id}/statut?statut=CONFIRMEE
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
        // PATCH /reservations/{id}/negociation?accepter=false
        // Le backend gère la logique REFUSEE / PRIX_REFUSE selon nbTentatives
        this.reservationService.repondreNegociation(id, false).subscribe({
            next: () => {
                this.snackBar.open('❌ Réservation refusée', 'Fermer', { duration: 3000 });
                this.chargerReservations();
                this.cdr.detectChanges();
            },
            error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
        });
    }

    getNomPassager(r: Reservation): string {
        return `${r.passagerPrenom ?? ''} ${r.passagerNom ?? ''}`.trim() || 'Passager inconnu';
    }
}