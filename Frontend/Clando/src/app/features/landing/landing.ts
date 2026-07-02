import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { RouterLink, Router } from '@angular/router';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,        // ✅ pour ngModel
        RouterLink,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
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

    constructor(private router: Router) {}

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
