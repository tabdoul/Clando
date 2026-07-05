import { Component, OnInit, ChangeDetectorRef,ViewEncapsulation  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { TrajetService } from '../../../core/services/trajet.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { AuthService } from '../../../core/services/auth.service';
import { Trajet } from '../../../shared/models/trajet.model';

@Component({
    selector: 'app-trajet-detail',
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatSnackBarModule,
        MatDividerModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule
    ],
    templateUrl: './trajet-detail.html',
    styleUrl: './trajet-detail.css'
})
export class TrajetDetailComponent implements OnInit {
    trajet: Trajet | null = null;
    loading = true;
    loadingReservation = false;

    departPassager = '';
    arriveePassager = '';

    // Suggestions quartiers Conakry
    quartiers = [
        'KM 36', 'Kountia', 'Lansanayah', 'Dabompa', 'Tombolia',
        'Enta', 'Kissosso', 'Sangoyah', 'Matoto', 'Yimbayah',
        'Aéroport', 'Gbessia', 'Dabondy', 'Bonfi', 'Matam',
        'Kenien', 'Madina', 'Donka', 'Cameroun', 'Kaloum',
        'Sonfonia', 'T8', 'T7', 'T6', 'T5', 'Wanindara',
        'Enco5', 'Cosa', 'Bambeto', 'Hamdallaye', 'Minière',
        'Dixinn', 'Kaporo', 'Kipé', 'Ratoma', 'Taouyah',
        'Nongo', 'Kobayah', 'Lambanyi', 'Yattaya', 'Cimenterie'
    ];

    quartiersDepart: string[] = [];
    quartiersArrivee: string[] = [];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private trajetService: TrajetService,
        private reservationService: ReservationService,
        private authService: AuthService,
        private snackBar: MatSnackBar,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        this.trajetService.getById(id).subscribe({
            next: (data) => {
                this.trajet = data;
                this.departPassager = data.villeDepart;
                this.arriveePassager = data.villeArrivee;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loading = false;
                this.cdr.detectChanges();
                this.router.navigate(['/trajets']);
            }
        });
    }

    filtrerDepart(valeur: string): void {
        const v = valeur.toLowerCase();
        this.quartiersDepart = this.quartiers.filter(q =>
            q.toLowerCase().includes(v)
        );
    }

    filtrerArrivee(valeur: string): void {
        const v = valeur.toLowerCase();
        this.quartiersArrivee = this.quartiers.filter(q =>
            q.toLowerCase().includes(v)
        );
    }

    reserver(): void {
        if (!this.authService.isLoggedIn()) {
            this.authService.setRedirectUrl(this.router.url);
            this.router.navigate(['/login']);
            return;
        }

        const userId = this.authService.getUserId();
        if (!userId || !this.trajet) return;

        if (!this.departPassager.trim() || !this.arriveePassager.trim()) {
            this.snackBar.open('Veuillez indiquer votre point de départ et d\'arrivée', 'Fermer', { duration: 3000 });
            return;
        }

        this.loadingReservation = true;
        this.reservationService.creer({
            nbPlaces: 1,
            passagerId: userId,
            trajetId: this.trajet.id,
            departPassager: this.departPassager.trim(),
            arriveePassager: this.arriveePassager.trim()
        }).subscribe({
            next: () => {
                this.loadingReservation = false;
                this.snackBar.open('Demande envoyée ! Le conducteur va confirmer votre réservation.', 'Fermer', { duration: 4000 });
                this.router.navigate(['/mes-reservations']);
            },
            error: (err: any) => {
                this.loadingReservation = false;
                this.snackBar.open(err.error?.erreur || 'Erreur lors de la réservation', 'Fermer', { duration: 3000 });
            }
        });
    }

    get isConnecte(): boolean {
        return this.authService.isLoggedIn();
    }

    get placesRestantes(): string {
        if (!this.trajet) return '';
        const n = this.trajet.placesDisponibles;
        if (n === 0) return 'Complet';
        if (n === 1) return '1 place restante';
        return `${n} places disponibles`;
    }
}
