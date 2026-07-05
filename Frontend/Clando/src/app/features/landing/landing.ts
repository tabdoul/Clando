import { Component,ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RouterLink, Router } from '@angular/router';
import { QUARTIERS_CONAKRY } from '../../shared/models/constants/quartiers';

@Component({
    selector: 'app-landing',
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatAutocompleteModule,
        MatInputModule,
        MatFormFieldModule,
    ],
    templateUrl: './landing.html',
    styleUrl: './landing.css'
})
export class LandingComponent {
    today: string = new Date().toISOString().split('T')[0];
    villeDepart: string = '';
    villeArrivee: string = '';
    dateDepart: string = '';
    nbPassagers: number = 1;

    // Autocomplete
    suggestionsDepart: string[] = [];
    suggestionsArrivee: string[] = [];

    constructor(private router: Router) {}

    // Filtre les quartiers
    filtrer(valeur: string): string[] {
        if (!valeur || valeur.length < 2) return [];
        const v = valeur.toLowerCase().trim();
        return QUARTIERS_CONAKRY.filter(q =>
            q.toLowerCase().includes(v)
        ).slice(0, 6);
    }

    onDepartChange() {
        this.suggestionsDepart = this.filtrer(this.villeDepart);
    }

    onArriveeChange() {
        this.suggestionsArrivee = this.filtrer(this.villeArrivee);
    }

    inverser() {
        const temp = this.villeDepart;
        this.villeDepart = this.villeArrivee;
        this.villeArrivee = temp;
    }

    rechercher() {
        this.router.navigate(['/trajets'], {
            queryParams: {
                depart: this.villeDepart,
                arrivee: this.villeArrivee,
                date: this.dateDepart
            }
        });
    }
}
