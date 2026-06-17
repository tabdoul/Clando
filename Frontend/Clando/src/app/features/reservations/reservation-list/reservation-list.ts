import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { ReservationService } from '../../../core/services/reservation.service';
import { Reservation } from '../../../shared/models/reservation.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-reservation-list',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
        MatChipsModule,
        MatTableModule
    ],
    templateUrl: './reservation-list.html',
    styleUrl: './reservation-list.css'
})
export class ReservationListComponent implements OnInit {

    reservations: Reservation[] = [];
    displayedColumns = ['trajet', 'date', 'places', 'statut', 'actions'];
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
    const userId = this.authService.getUserId() || 1;
    this.reservationService.getByPassager(userId).subscribe({
        next: (data) => {
            const maintenant = new Date();
            const uneSemaine = 7 * 24 * 60 * 60 * 1000; // 7 jours en millisecondes

            this.reservations = data.filter(r => {
                // Toujours afficher EN_ATTENTE
                if (r.statut === 'EN_ATTENTE') return true;

                // Pour CONFIRMEE — afficher seulement si moins de 7 jours
                if (r.statut === 'CONFIRMEE') {
                       if (!r.dateReservation) return true; // si pas de date, on affiche quand même
                          const dateReservation = new Date(r.dateReservation);
                          const diff = maintenant.getTime() - dateReservation.getTime();
                          return diff < uneSemaine;
}

                return false;
            });

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

    annuler(id: number): void {
        this.reservationService.changerStatut(id, 'ANNULEE').subscribe({
            next: () => {
                this.snackBar.open('Réservation annulée', 'Fermer', { duration: 3000 });
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
            case 'ANNULEE': return 'warn';
            default: return 'primary';
        }
    }
}
