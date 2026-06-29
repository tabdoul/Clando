import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReservationService } from '../../../core/services/reservation.service';
import { Reservation } from '../../../shared/models/reservation.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-reservation-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
        MatTabsModule,
        MatDividerModule,
        MatFormFieldModule,
        MatInputModule
    ],
    templateUrl: './reservation-list.html',
    styleUrl: './reservation-list.css'
})
export class ReservationListComponent implements OnInit {

    mesReservations: Reservation[] = [];
    loadingPassager = false;

    reservationsRecues: Reservation[] = [];
    loadingConducteur = false;

    numerosPaiement: Record<number, string> = {};
    loadingPaiement: Record<number, boolean> = {};

    constructor(
        private reservationService: ReservationService,
        private authService: AuthService,
        private snackBar: MatSnackBar,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.chargerMesReservations();
        this.chargerReservationsRecues();
    }

    // ─── PASSAGER ───────────────────────────────────────────────

    chargerMesReservations(): void {
        this.loadingPassager = true;
        const userId = this.authService.getUserId();
        if (!userId) { this.loadingPassager = false; return; }

        this.reservationService.getByPassager(userId).subscribe({
            next: (data) => {
                this.mesReservations = data.sort((a, b) => {
                    const ordre: Record<string, number> = {
                        'EN_ATTENTE': 0, 'CONFIRMEE': 1,
                        'REFUSEE': 2, 'ANNULEE': 3, 'TERMINEE': 4
                    };
                    return (ordre[a.statut] ?? 9) - (ordre[b.statut] ?? 9);
                });
                this.loadingPassager = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loadingPassager = false;
                this.snackBar.open('Erreur lors du chargement', 'Fermer', { duration: 3000 });
            }
        });
    }

    peutAnnuler(r: Reservation): boolean {
        return ['EN_ATTENTE', 'CONFIRMEE'].includes(r.statut);
    }

    annulerReservation(r: Reservation): void {
        if (!r.id || !confirm('Confirmer l\'annulation ?')) return;
        this.reservationService.annuler(r.id).subscribe({
            next: (res) => {
                this.snackBar.open(res.message, 'Fermer', { duration: 5000 });
                this.chargerMesReservations();
            },
            error: (err) => this.snackBar.open(err.error?.erreur || 'Erreur', 'Fermer', { duration: 3000 })
        });
    }

    initierPaiement(r: Reservation): void {
        if (!r.id) return;
        const numero = this.numerosPaiement[r.id];
        if (!numero?.trim()) {
            this.snackBar.open('Veuillez entrer votre numéro Orange Money', 'Fermer', { duration: 3000 });
            return;
        }
        this.loadingPaiement[r.id] = true;
        this.reservationService.payerTest(r.id).subscribe({
            next: () => {
                this.loadingPaiement[r.id!] = false;
                this.snackBar.open('Paiement confirmé !', 'Fermer', { duration: 4000 });
                this.chargerMesReservations();
            },
            error: (err) => {
                this.loadingPaiement[r.id!] = false;
                this.snackBar.open(err.error?.erreur || 'Erreur paiement', 'Fermer', { duration: 3000 });
            }
        });
    }

    // ─── CONDUCTEUR ─────────────────────────────────────────────

    chargerReservationsRecues(): void {
        this.loadingConducteur = true;
        const userId = this.authService.getUserId();
        if (!userId) { this.loadingConducteur = false; return; }

        this.reservationService.getEnAttenteParConducteur(userId).subscribe({
            next: (data) => {
                this.reservationsRecues = data;
                this.loadingConducteur = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loadingConducteur = false;
                this.snackBar.open('Erreur lors du chargement', 'Fermer', { duration: 3000 });
            }
        });
    }

    confirmerReservation(r: Reservation): void {
        if (!r.id) return;
        this.reservationService.changerStatut(r.id, 'CONFIRMEE').subscribe({
            next: () => {
                this.snackBar.open('Réservation confirmée !', 'Fermer', { duration: 3000 });
                this.chargerReservationsRecues();
            },
            error: (err) => this.snackBar.open(err.error?.erreur || 'Erreur', 'Fermer', { duration: 3000 })
        });
    }

    refuserReservation(r: Reservation): void {
        if (!r.id || !confirm('Refuser cette demande ?')) return;
        this.reservationService.repondreNegociation(r.id, false).subscribe({
            next: () => {
                this.snackBar.open('Réservation refusée', 'Fermer', { duration: 3000 });
                this.chargerReservationsRecues();
            },
            error: (err) => this.snackBar.open(err.error?.erreur || 'Erreur', 'Fermer', { duration: 3000 })
        });
    }

    // ─── UTILITAIRES ────────────────────────────────────────────

    getPrixBase(r: Reservation): number {
        return Math.round((r.prix || 0) / 1.13);
    }

    getFreais(r: Reservation): number {
        return Math.round((r.prix || 0) - this.getPrixBase(r));
    }

    getStatutLabel(statut: string): string {
        switch (statut) {
            case 'EN_ATTENTE': return 'En attente';
            case 'CONFIRMEE':  return 'Confirmée';
            case 'ANNULEE':    return 'Annulée';
            case 'REFUSEE':    return 'Refusée';
            case 'TERMINEE':   return 'Terminée';
            default:           return statut;
        }
    }

    getNomPassager(r: Reservation): string {
        return `${r.passagerPrenom ?? ''} ${r.passagerNom ?? ''}`.trim() || 'Passager inconnu';
    }

    getTrajetLabel(r: Reservation): string {
        if (!r.villeDepart && !r.villeArrivee) return '—';
        return `${r.villeDepart ?? '?'} → ${r.villeArrivee ?? '?'}`;
    }
}
