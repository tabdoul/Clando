import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReservationService } from '../../../core/services/reservation.service';
import { Reservation } from '../../../shared/models/reservation.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSnackBarModule
    ],
    templateUrl: './notifications.html',
    styleUrl: './notifications.css'
})
export class NotificationsComponent implements OnInit {

    reservations: Reservation[] = [];
    loading = false;
    contreOffres: Record<number, number> = {};

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
        if (!userId) { this.loading = false; return; }

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
        this.reservationService.repondreNegociation(id, true).subscribe({
            next: () => {
                this.snackBar.open('Réservation confirmée !', 'Fermer', { duration: 3000 });
                this.chargerReservations();
                this.cdr.detectChanges();
            },
            error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
        });
    }

    refuser(id: number): void {
        this.reservationService.repondreNegociation(id, false).subscribe({
            next: () => {
                this.snackBar.open('Réservation refusée', 'Fermer', { duration: 3000 });
                this.chargerReservations();
                this.cdr.detectChanges();
            },
            error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
        });
    }

    envoyerContreOffre(id: number, prix: number): void {
        if (!prix || prix <= 0) {
            this.snackBar.open('Veuillez entrer un prix valide', 'Fermer', { duration: 3000 });
            return;
        }
        this.reservationService.repondreNegociationAvecPrix(id, prix).subscribe({
            next: () => {
                this.snackBar.open('Contre-offre envoyée au passager !', 'Fermer', { duration: 3000 });
                this.contreOffres[id] = 0;
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