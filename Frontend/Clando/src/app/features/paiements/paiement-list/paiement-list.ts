import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { PaiementService } from '../../../core/services/paiement.service';
import { Paiement } from '../../../shared/models/paiement.model';

@Component({
    selector: 'app-paiement-list',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
        MatTableModule,
        MatChipsModule
    ],
    templateUrl: './paiement-list.html',
    styleUrl: './paiement-list.css'
})
export class PaiementListComponent implements OnInit {

    paiements: Paiement[] = [];
    displayedColumns = ['reservation', 'montant', 'methode', 'statut', 'date'];
    loading = false;

    constructor(
        private paiementService: PaiementService,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.chargerPaiements();
    }

    chargerPaiements(): void {
        this.loading = true;
        this.paiementService.getAll().subscribe({
            next: (data) => {
                this.paiements = data;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.snackBar.open('Erreur lors du chargement', 'Fermer', { duration: 3000 });
            }
        });
    }

    getStatutColor(statut: string): string {
        switch (statut) {
            case 'EFFECTUE': return 'primary';
            case 'EN_ATTENTE': return 'accent';
            case 'ECHOUE': return 'warn';
            default: return 'primary';
        }
    }
}
