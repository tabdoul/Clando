import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TrajetService } from '../../../core/services/trajet.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { AuthService } from '../../../core/services/auth.service';
import { Trajet } from '../../../shared/models/trajet.model';

@Component({
    selector: 'app-trajet-list',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSnackBarModule,
        MatChipsModule,
        MatDatepickerModule,
        MatNativeDateModule
    ],
    templateUrl: './trajet-list.html',
    styleUrl: './trajet-list.css'
})
export class TrajetListComponent implements OnInit {

    trajets: Trajet[] = [];
    searchForm: FormGroup;
    loading = false;
    rechercheLancee = false;

    constructor(
        private trajetService: TrajetService,
        private reservationService: ReservationService,
        private authService: AuthService,
        private fb: FormBuilder,
        private snackBar: MatSnackBar,
        private cdr: ChangeDetectorRef
    ) {
        this.searchForm = this.fb.group({
            villeDepart: [''],
            villeArrivee: [''],
            dateDepart: [''],
            nbPassagers: [1]
        });
    }

    ngOnInit(): void {}

    chargerTrajets(): void {
        this.loading = true;
        this.trajetService.getAll().subscribe({
            next: (data) => {
                const maintenant = new Date();
                this.trajets = data.filter(t =>
                    t.statut === 'OUVERT' &&
                    new Date(t.dateHeureDepart) > maintenant
                );
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loading = false;
                this.cdr.detectChanges();
                this.snackBar.open('Erreur lors du chargement des trajets', 'Fermer', { duration: 3000 });
            }
        });
    }

    rechercher(): void {
        const { villeDepart, villeArrivee } = this.searchForm.value;
        this.rechercheLancee = true;
        this.loading = true;

        if (!villeDepart || !villeArrivee) {
            this.chargerTrajets();
            return;
        }

        this.trajetService.rechercher(
            villeDepart.trim().toLowerCase(),
            villeArrivee.trim().toLowerCase()
        ).subscribe({
            next: (data) => {
                this.trajets = data;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loading = false;
                this.cdr.detectChanges();
                this.snackBar.open('Erreur lors de la recherche', 'Fermer', { duration: 3000 });
            }
        });
    }

    reserver(trajet: Trajet): void {
        const userId = this.authService.getUserId();

        if (!userId) {
            this.snackBar.open('Veuillez vous connecter', 'Fermer', { duration: 3000 });
            return;
        }

        const reservation = {
            nbPlaces: 1,
            passagerId: userId,
            trajetId: trajet.id
        };

        this.reservationService.creer(reservation).subscribe({
            next: () => {
                this.snackBar.open('✅ Réservation effectuée avec succès !', 'Fermer', { duration: 3000 });
                this.rechercher();
                this.cdr.detectChanges();
            },
            error: (err) => {
                const message = err.error?.erreur || '❌ Erreur lors de la réservation';
                this.snackBar.open(message, 'Fermer', { duration: 3000 });
            }
        });
    }
}
