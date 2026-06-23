import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { TrajetService } from '../../../core/services/trajet.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { AuthService } from '../../../core/services/auth.service';
import { Trajet } from '../../../shared/models/trajet.model';
import { QUARTIERS_CONAKRY } from '../../../shared/models/constants/quartiers';

@Component({
    selector: 'app-trajet-list',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterLink,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSnackBarModule,
        MatChipsModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatAutocompleteModule
    ],
    templateUrl: './trajet-list.html',
    styleUrl: './trajet-list.css'
})
export class TrajetListComponent implements OnInit {

    trajets: Trajet[] = [];
    searchForm: FormGroup;
    loading = false;
    rechercheLancee = false;

    // Autocomplete
    quartiersDepart: string[] = [];
    quartiersArrivee: string[] = [];

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

    ngOnInit(): void {
        // Autocomplete départ
        this.chargerTrajets();
        this.searchForm.get('villeDepart')?.valueChanges.subscribe(val => {
            this.quartiersDepart = this.filtrerQuartiers(val);
        });

        // Autocomplete arrivée
        this.searchForm.get('villeArrivee')?.valueChanges.subscribe(val => {
            this.quartiersArrivee = this.filtrerQuartiers(val);
        });
    }

    filtrerQuartiers(val: string): string[] {
        if (!val || val.length < 2) return [];
        const recherche = val.toLowerCase().trim();
        return QUARTIERS_CONAKRY.filter(q =>
            q.toLowerCase().includes(recherche)
        ).slice(0, 6);
    }

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
        next: (data: any) => {
            
            this.trajets = data.content || data;
            this.loading = false;
            this.cdr.detectChanges();
        },
        error: (err) => {
            console.log('Erreur recherche:', err);
            this.loading = false;
            this.cdr.detectChanges();
            this.snackBar.open('Erreur lors de la recherche', 'Fermer', { duration: 3000 });
        }
    });
}
}