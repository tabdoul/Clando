import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { AvisService } from '../../../core/services/avis.service';
import { Avis } from '../../../shared/models/avis.model';

@Component({
    selector: 'app-avis-list',
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
        MatSelectModule
    ],
    templateUrl: './avis-list.html',
    styleUrl: './avis-list.css'
})
export class AvisListComponent implements OnInit {

    avis: Avis[] = [];
    avisForm: FormGroup;
    showForm = false;
    loading = false;
    notes = [1, 2, 3, 4, 5];

    constructor(
        private avisService: AvisService,
        private fb: FormBuilder,
        private snackBar: MatSnackBar,
        private cdr: ChangeDetectorRef
    ) {
        this.avisForm = this.fb.group({
            note: ['', Validators.required],
            commentaire: [''],
            auteurId: [1, Validators.required],
            destinataireId: ['', Validators.required],
            trajetId: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        this.chargerAvis();
    }

    chargerAvis(): void {
        this.loading = true;
        this.avisService.getByAuteur(1).subscribe({
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

    ajouterAvis(): void {
        if (this.avisForm.invalid) return;

        this.avisService.creer(this.avisForm.value).subscribe({
            next: () => {
                this.snackBar.open('Avis ajouté !', 'Fermer', { duration: 3000 });
                this.showForm = false;
                this.avisForm.reset({ auteurId: 1 });
                this.chargerAvis();
            },
            error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
        });
    }

    supprimer(id: number): void {
        this.avisService.supprimer(id).subscribe({
            next: () => {
                this.snackBar.open('Avis supprimé', 'Fermer', { duration: 3000 });
                this.chargerAvis();
            },
            error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
        });
    }

    getStars(note: number): string {
        return '⭐'.repeat(note);
    }
}
