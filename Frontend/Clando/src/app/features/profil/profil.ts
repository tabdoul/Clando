import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { VehiculeService } from '../../core/services/vehicule.service';
import { TrajetService } from '../../core/services/trajet.service';
import { environment } from '../../../environments/environments';

@Component({
    selector: 'app-profil',
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
        MatTabsModule,
        MatDividerModule,
        MatListModule
    ],
    templateUrl: './profil.html',
    styleUrl: './profil.css'
})
export class ProfilComponent implements OnInit {

    utilisateur: any = null;
    vehicules: any[] = [];
    trajets: any[] = [];
    showVehiculeForm = false;
    loading = false;

    profilForm: FormGroup;
    vehiculeForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private vehiculeService: VehiculeService,
        private trajetService: TrajetService,
        private http: HttpClient,
        private router: Router,
        private snackBar: MatSnackBar,
        private cdr: ChangeDetectorRef
    ) {
        this.profilForm = this.fb.group({
            nom:       [{ value: '', disabled: true }],
            prenom:    [{ value: '', disabled: true }],
            email:     ['', [Validators.required, Validators.email]],
            telephone: [''],
            miniBio:   ['']
        });

        this.vehiculeForm = this.fb.group({
            marque:          ['', Validators.required],
            modele:          ['', Validators.required],
            immatriculation: ['', Validators.required],
            nbPlaces:        [4, [Validators.required, Validators.min(1), Validators.max(9)]]
        });
    }

    ngOnInit(): void {
        this.chargerProfil();
        this.chargerVehicules();
        this.chargerTrajets();
    }

    chargerProfil(): void {
        const userId = this.authService.getUserId();
        if (!userId) return;

        this.http.get<any>(`${environment.apiUrl}/utilisateurs/${userId}`).subscribe({
            next: (data) => {
                this.utilisateur = data;
                this.profilForm.patchValue({
                    nom:       data.nom,
                    prenom:    data.prenom,
                    email:     data.email,
                    telephone: data.telephone,
                    miniBio:   data.miniBio
                });
                this.cdr.detectChanges();
            },
            error: () => this.snackBar.open('Erreur chargement profil', 'Fermer', { duration: 3000 })
        });
    }

    chargerVehicules(): void {
        const userId = this.authService.getUserId();
        if (!userId) return;

        this.vehiculeService.getByConducteur(userId).subscribe({
            next: (data) => { this.vehicules = data; this.cdr.detectChanges(); },
            error: () => this.snackBar.open('Erreur chargement véhicules', 'Fermer', { duration: 3000 })
        });
    }

    chargerTrajets(): void {
    const userId = this.authService.getUserId();
    if (!userId) return;

    this.trajetService.getByConducteur(userId).subscribe({
        next: (data) => {
            this.trajets = data.filter((t: any) =>
                t.statut === 'OUVERT' || t.statut === 'COMPLET'
            );
            this.cdr.detectChanges();
        },
        error: () => this.snackBar.open('Erreur chargement trajets', 'Fermer', { duration: 3000 })
    });
}

    modifierProfil(): void {
        if (this.profilForm.invalid) return;
        const userId = this.authService.getUserId();
        if (!userId) return;

        this.http.put<any>(`${environment.apiUrl}/utilisateurs/${userId}`,
            this.profilForm.getRawValue()).subscribe({
            next: (data) => {
                this.utilisateur = data;
                this.snackBar.open('✅ Profil mis à jour !', 'Fermer', { duration: 3000 });
                this.cdr.detectChanges();
            },
            error: () => this.snackBar.open('Erreur mise à jour profil', 'Fermer', { duration: 3000 })
        });
    }

    getInitiales(): string {
        if (!this.utilisateur) return '?';
        return `${this.utilisateur.nom?.charAt(0)}${this.utilisateur.prenom?.charAt(0)}`.toUpperCase();
    }

    ajouterVehicule(): void {
        if (this.vehiculeForm.invalid) return;
        const userId = this.authService.getUserId();
        if (!userId) return;

        this.vehiculeService.creer({ ...this.vehiculeForm.value, conducteurId: userId }).subscribe({
            next: () => {
                this.snackBar.open('✅ Véhicule ajouté !', 'Fermer', { duration: 3000 });
                this.showVehiculeForm = false;
                this.vehiculeForm.reset({ nbPlaces: 4 });
                this.chargerVehicules();
            },
            error: () => this.snackBar.open('Erreur ajout véhicule', 'Fermer', { duration: 3000 })
        });
    }

    supprimerVehicule(id: number): void {
        if (!confirm('Supprimer ce véhicule ?')) return;
        this.vehiculeService.supprimer(id).subscribe({
            next: () => {
                this.snackBar.open('Véhicule supprimé', 'Fermer', { duration: 3000 });
                this.chargerVehicules();
            },
            error: () => this.snackBar.open('Erreur suppression', 'Fermer', { duration: 3000 })
        });
    }

    terminerTrajet(id: number): void {
        if (!confirm('Confirmer la fin du trajet ?')) return;
        this.trajetService.changerStatut(id, 'TERMINE').subscribe({
            next: () => {
                this.snackBar.open('✅ Trajet terminé !', 'Fermer', { duration: 3000 });
                this.chargerTrajets();
                this.cdr.detectChanges();
            },
            error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
        });
    }

    annulerTrajet(id: number): void {
        if (!confirm('Êtes-vous sûr de vouloir annuler ce trajet ?')) return;
        this.trajetService.changerStatut(id, 'ANNULE').subscribe({
            next: () => {
                this.snackBar.open('✅ Trajet annulé', 'Fermer', { duration: 3000 });
                this.chargerTrajets();
                this.cdr.detectChanges();
            },
            error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 })
        });
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    fermerCompte(): void {
        if (!confirm('Êtes-vous sûr ? Cette action est irréversible.')) return;
        const userId = this.authService.getUserId();
        if (!userId) return;

        this.http.delete(`${environment.apiUrl}/utilisateurs/${userId}`).subscribe({
            next: () => {
                this.authService.logout();
                this.router.navigate(['/login']);
                this.snackBar.open('Compte fermé', 'Fermer', { duration: 3000 });
            },
            error: () => this.snackBar.open('Erreur fermeture compte', 'Fermer', { duration: 3000 })
        });
    }
}
