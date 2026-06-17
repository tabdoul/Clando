import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { VehiculeService } from '../../../core/services/vehicule.service';
import { TrajetService } from '../../../core/services/trajet.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-vehicule-list',
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
        MatDatepickerModule,
        MatNativeDateModule,
        MatDividerModule,
        MatSelectModule
    ],
    templateUrl: './vehicule-list.html',
    styleUrl: './vehicule-list.css'
})
export class VehiculeListComponent implements OnInit {

    vehiculeForm: FormGroup;
    trajetForm: FormGroup;
    vehicules: any[] = [];
    vehiculeSelectionne: any = null;
    showNouveauVehicule = false;
    heures = Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0'));
    minutes = ['00', '15', '30', '45'];
    itineraires = ['Autoroute', 'Route du Prince', 'Corniche'];

    constructor(
        private fb: FormBuilder,
        private vehiculeService: VehiculeService,
        private trajetService: TrajetService,
        private authService: AuthService,
        private snackBar: MatSnackBar,
        private router: Router
    ) {
        this.trajetForm = this.fb.group({
            villeDepart: ['', Validators.required],
            villeArrivee: ['', Validators.required],
            dateDepart: ['', Validators.required],
            heure: ['', Validators.required],
            minute: ['', Validators.required],
            prix: ['', [Validators.required, Validators.min(0)]],
            placesDisponibles: [1, [Validators.required, Validators.min(1), Validators.max(9)]],
            itineraire: ['']
        });

        this.vehiculeForm = this.fb.group({
            marque: ['', Validators.required],
            modele: ['', Validators.required],
            immatriculation: ['', Validators.required],
            nbPlaces: [4, [Validators.required, Validators.min(1), Validators.max(9)]]
        });
    }

    ngOnInit(): void {
        this.chargerVehicules();
    }

    chargerVehicules(): void {
        const userId = this.authService.getUserId();
        if (!userId) return;

        this.vehiculeService.getByConducteur(userId).subscribe({
            next: (data) => {
                this.vehicules = data;
                if (data.length > 0) {
                    this.vehiculeSelectionne = data[0];
                }
            },
            error: () => this.snackBar.open('Erreur lors du chargement des véhicules', 'Fermer', { duration: 3000 })
        });
    }

    selectionnerVehicule(vehicule: any): void {
        this.vehiculeSelectionne = vehicule;
        this.showNouveauVehicule = false;
    }

    ajouterNouveauVehicule(): void {
        if (this.vehiculeForm.invalid) return;
        const userId = this.authService.getUserId();
        if (!userId) return;

        const vehiculeData = {
            ...this.vehiculeForm.value,
            conducteurId: userId
        };

        this.vehiculeService.creer(vehiculeData).subscribe({
            next: (vehicule) => {
                this.snackBar.open('✅ Véhicule ajouté !', 'Fermer', { duration: 3000 });
                this.showNouveauVehicule = false;
                this.vehiculeForm.reset({ nbPlaces: 4 });
                this.chargerVehicules();
                this.vehiculeSelectionne = vehicule;
            },
            error: () => this.snackBar.open('Erreur lors de l\'ajout du véhicule', 'Fermer', { duration: 3000 })
        });
    }

    publierTrajet(): void {
        if (this.trajetForm.invalid) {
            this.snackBar.open('Veuillez remplir tous les champs', 'Fermer', { duration: 3000 });
            return;
        }

        if (!this.vehiculeSelectionne) {
            this.snackBar.open('Veuillez sélectionner un véhicule', 'Fermer', { duration: 3000 });
            return;
        }

        const userId = this.authService.getUserId();
        if (!userId) return;

        const date = new Date(this.trajetForm.value.dateDepart);
        const heure = this.trajetForm.value.heure;
        const minute = this.trajetForm.value.minute;
        date.setHours(parseInt(heure), parseInt(minute), 0);
        const dateFormatee = date.toISOString().slice(0, 19);

        const trajetData = {
            villeDepart: this.trajetForm.value.villeDepart,
            villeArrivee: this.trajetForm.value.villeArrivee,
            dateHeureDepart: dateFormatee,
            prix: this.trajetForm.value.prix,
            placesDisponibles: this.trajetForm.value.placesDisponibles,
            itineraire: this.trajetForm.value.itineraire,
            conducteurId: userId,
            vehiculeId: this.vehiculeSelectionne.id
        };

        this.trajetService.creer(trajetData).subscribe({
            next: () => {
                this.snackBar.open('🎉 Trajet publié avec succès !', 'Fermer', { duration: 3000 });
                this.router.navigate(['/trajets']);
            },
            error: () => this.snackBar.open('Erreur lors de la publication', 'Fermer', { duration: 3000 })
        });
    }
}
