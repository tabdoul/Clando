import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AvisService } from '../../../core/services/avis.service';
import { Avis } from '../../../shared/models/avis.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-avis-list',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatSnackBarModule
    ],
    templateUrl: './avis-list.html',
    styleUrl: './avis-list.css'
})
export class AvisListComponent implements OnInit {

    avis: Avis[] = [];
    loading = false;

    constructor(
        private avisService: AvisService,
        private authService: AuthService,
        private snackBar: MatSnackBar,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.chargerAvis();
    }

    chargerAvis(): void {
        this.loading = true;
        const userId = this.authService.getUserId();
        if (!userId) { this.loading = false; return; }

        this.avisService.getByDestinataire(userId).subscribe({
            next: (data) => {
                this.avis = data;
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

    getStars(note: number): string {
        return '⭐'.repeat(note);
    }
}